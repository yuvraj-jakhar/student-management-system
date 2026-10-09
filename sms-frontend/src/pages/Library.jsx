import { useState, useEffect } from "react";
import {
  BookMarked,
  Search,
  Plus,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BookOpen,
  ArrowRightLeft,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Edit2,
  FileSpreadsheet,
} from "lucide-react";
import toast from "react-hot-toast";

import {
  getBooks,
  createBook,
  updateBook,
  deactivateBook,
  issueBook,
  returnBook,
  renewBook,
  getMyIssuedBooks,
  getAllIssues,
  getOverdueBooks,
  getLibraryStats,
} from "../services/library";
import { searchUsers } from "../services/admin";
import { getCurrentUser } from "../services/auth";

import Loader from "../components/Loader";
import Modal from "../components/Modal";

export default function Library() {
  const currentUser = getCurrentUser();
  const roles = Array.isArray(currentUser?.role) ? currentUser.role : [currentUser?.role || ""];
  const isLibrarian = roles.includes("librarian") || roles.includes("admin");
  const isStudent = roles.includes("student");

  const [activeTab, setActiveTab] = useState(isLibrarian ? "catalogue" : "my_books");
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    total_titles: 0,
    total_copies: 0,
    available_copies: 0,
    active_issues: 0,
    overdue_count: 0,
  });

  // Catalogue
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Issues / Circulation
  const [issues, setIssues] = useState([]);
  const [myBooks, setMyBooks] = useState([]);
  const [overdueList, setOverdueList] = useState([]);

  // Modals
  const [addBookModalOpen, setAddBookModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [renewModalOpen, setRenewModalOpen] = useState(false);

  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    isbn: "",
    category: "Computer Science",
    publisher: "",
    edition: "",
    total_copies: 5,
    shelf_location: "",
    description: "",
  });

  const [issueForm, setIssueForm] = useState({
    book_id: "",
    student_id: "",
    due_days: 14,
    notes: "",
  });

  const [studentOptions, setStudentOptions] = useState([]);

  useEffect(() => {
    loadStats();
    if (activeTab === "catalogue") loadBooks();
    else if (activeTab === "my_books") loadMyBooks();
    else if (activeTab === "issues") loadIssues();
    else if (activeTab === "overdue") loadOverdue();
  }, [activeTab, search, categoryFilter, availableOnly]);

  const loadStats = async () => {
    try {
      const data = await getLibraryStats();
      setStats(data);
    } catch {
      // stats error
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      const data = await getBooks(search, categoryFilter, availableOnly);
      setBooks(data.books || []);
    } catch {
      toast.error("Failed to load book catalogue");
    } finally {
      setLoading(false);
    }
  };

  const loadMyBooks = async () => {
    try {
      setLoading(true);
      const data = await getMyIssuedBooks();
      setMyBooks(data || []);
    } catch {
      toast.error("Failed to load your circulation records");
    } finally {
      setLoading(false);
    }
  };

  const loadIssues = async () => {
    try {
      setLoading(true);
      const data = await getAllIssues(null, search);
      setIssues(data.issues || []);
    } catch {
      toast.error("Failed to load circulation records");
    } finally {
      setLoading(false);
    }
  };

  const loadOverdue = async () => {
    try {
      setLoading(true);
      const data = await getOverdueBooks();
      setOverdueList(data || []);
    } catch {
      toast.error("Failed to load overdue books");
    } finally {
      setLoading(false);
    }
  };

  const openIssueModal = async (book = null) => {
    if (book) {
      setSelectedBook(book);
      setIssueForm({ ...issueForm, book_id: book._id });
    }
    try {
      const res = await searchUsers(1, 50, "", "student");
      setStudentOptions(res.users || []);
    } catch {
      // error fetching students
    }
    setIssueModalOpen(true);
  };

  const handleAddBookSubmit = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await createBook(bookForm);
      toast.success("Book added to library catalogue");
      setAddBookModalOpen(false);
      setBookForm({
        title: "",
        author: "",
        isbn: "",
        category: "Computer Science",
        publisher: "",
        edition: "",
        total_copies: 5,
        shelf_location: "",
        description: "",
      });
      loadBooks();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add book");
    } finally {
      setActionLoading(false);
    }
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!issueForm.book_id || !issueForm.student_id) {
      toast.error("Please select both a book and a student");
      return;
    }
    try {
      setActionLoading(true);
      await issueBook(issueForm);
      toast.success("Book issued successfully");
      setIssueModalOpen(false);
      loadBooks();
      loadStats();
      if (activeTab === "issues") loadIssues();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to issue book");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturnSubmit = async () => {
    if (!selectedIssue) return;
    try {
      setActionLoading(true);
      const res = await returnBook({ issue_id: selectedIssue._id });
      toast.success(
        res.is_overdue
          ? `Book returned. Fine payable: ₹${res.fine_amount}`
          : "Book returned with zero overdue fines"
      );
      setReturnModalOpen(false);
      if (activeTab === "issues") loadIssues();
      else if (activeTab === "overdue") loadOverdue();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to return book");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenewSubmit = async () => {
    if (!selectedIssue) return;
    try {
      setActionLoading(true);
      await renewBook({ issue_id: selectedIssue._id, additional_days: 14 });
      toast.success("Book renewed for an additional 14 days");
      setRenewModalOpen(false);
      if (activeTab === "issues") loadIssues();
      else if (activeTab === "my_books") loadMyBooks();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Renewal failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to deactivate this book from the catalogue?")) return;
    try {
      await deactivateBook(bookId);
      toast.success("Book deactivated");
      loadBooks();
      loadStats();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Cannot deactivate book with active issues");
    }
  };

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Central University Library
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700">
              ERP Module
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Book catalogue, circulation checkout, return tracking, and overdue fine governance
          </p>
        </div>

        {isLibrarian && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openIssueModal()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <ArrowRightLeft size={15} /> Issue Book
            </button>
            <button
              onClick={() => setAddBookModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
            >
              <Plus size={16} /> Add New Title
            </button>
          </div>
        )}
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Total Book Titles</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-slate-900">{stats.total_titles}</span>
            <span className="text-xs font-medium text-slate-500">{stats.total_copies} total copies</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Available on Shelves</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-emerald-600">{stats.available_copies}</span>
            <span className="text-xs font-medium text-emerald-600/80">Ready to issue</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Currently Checked Out</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-indigo-600">{stats.active_issues}</span>
            <span className="text-xs font-medium text-indigo-500">In circulation</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-semibold text-slate-400">Overdue Returns</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-black text-rose-600">{stats.overdue_count}</span>
            <span className="text-xs font-medium text-rose-500">₹5/day fine rule</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
        {isLibrarian && (
          <button
            onClick={() => setActiveTab("catalogue")}
            className={`px-4 py-2 rounded-lg transition ${
              activeTab === "catalogue"
                ? "bg-white text-indigo-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Book Catalogue
          </button>
        )}

        <button
          onClick={() => setActiveTab("my_books")}
          className={`px-4 py-2 rounded-lg transition ${
            activeTab === "my_books"
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          My Issued Books
        </button>

        {isLibrarian && (
          <>
            <button
              onClick={() => setActiveTab("issues")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "issues"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Circulation History
            </button>

            <button
              onClick={() => setActiveTab("overdue")}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === "overdue"
                  ? "bg-white text-rose-600 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Overdue List ({stats.overdue_count})
            </button>
          </>
        )}
      </div>

      {/* TAB 1: BOOK CATALOGUE */}
      {activeTab === "catalogue" && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="flex-1 w-full flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus-within:border-indigo-600 focus-within:bg-white transition">
              <Search size={16} className="text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, author, ISBN or publisher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-hidden text-slate-800 bg-transparent placeholder-slate-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
              >
                <option value="">All Categories</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence">Artificial Intelligence</option>
                <option value="Electronics & Hardware">Electronics</option>
                <option value="Software Engineering">Software Eng</option>
              </select>

              <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-0"
                />
                Available Only
              </label>
            </div>
          </div>

          {/* Books Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <Loader text="Loading library titles..." />
            ) : books.length === 0 ? (
              <div className="text-center py-16 px-4">
                <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
                <h3 className="text-sm font-bold text-slate-700">No books found</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Try adjusting your search filters or add a new title.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-5">Book Details</th>
                      <th className="py-3 px-4">ISBN</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4 text-center">Availability</th>
                      <th className="py-3 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {books.map((book) => {
                      const isAvail = book.available_copies > 0;
                      return (
                        <tr key={book._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3 px-5">
                            <p className="font-bold text-slate-900 leading-tight">
                              {book.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              by {book.author} {book.edition ? `(${book.edition})` : ""}
                            </p>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">
                            {book.isbn}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                              {book.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {book.shelf_location || "Central Stack"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAvail
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              {book.available_copies} / {book.total_copies} Left
                            </span>
                          </td>
                          <td className="py-3 px-5 text-right space-x-1">
                            {isLibrarian && (
                              <>
                                <button
                                  disabled={!isAvail}
                                  onClick={() => openIssueModal(book)}
                                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 transition"
                                  title="Issue this book"
                                >
                                  Issue
                                </button>
                                <button
                                  onClick={() => handleDeactivateBook(book._id)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                                  title="Deactivate"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MY ISSUED BOOKS */}
      {activeTab === "my_books" && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <Loader text="Loading your active book checkouts..." />
          ) : myBooks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle size={40} className="mx-auto text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No active books borrowed</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                You currently have no checked-out books from the Central Library.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Book Title</th>
                    <th className="py-3 px-4">Issued On</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Circulation Status</th>
                    <th className="py-3 px-4 text-center">Overdue Fine</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myBooks.map((item) => {
                    const isOverdue = item.is_overdue;
                    return (
                      <tr key={item._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-5">
                          <p className="font-bold text-slate-900">{item.book_title}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ISBN: {item.book_isbn}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.issue_date ? new Date(item.issue_date).toLocaleDateString() : "--"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-800">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : "--"}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === "returned"
                                ? "bg-slate-100 text-slate-600 border-slate-200"
                                : isOverdue
                                ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {item.status === "returned"
                              ? "Returned"
                              : isOverdue
                              ? `Overdue by ${item.days_overdue} days`
                              : "Active (Borrowed)"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.current_fine > 0 ? (
                            <span className="font-bold text-rose-600 font-mono">
                              ₹{item.current_fine}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹0.00</span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right">
                          {item.status !== "returned" && (
                            <button
                              onClick={() => {
                                setSelectedIssue(item);
                                setRenewModalOpen(true);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
                            >
                              Renew Book
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CIRCULATION HISTORY (LIBRARIAN / ADMIN) */}
      {activeTab === "issues" && isLibrarian && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <Loader text="Loading circulation logs..." />
          ) : issues.length === 0 ? (
            <div className="text-center py-16 px-4">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">No circulation records</h3>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-5">Book</th>
                    <th className="py-3 px-4">Student / Borrower</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {issues.map((iss) => (
                    <tr key={iss._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-5">
                        <p className="font-bold text-slate-900">{iss.book_title}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ISBN: {iss.book_isbn}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{iss.student_name}</p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {iss.student_enrollment} ({iss.student_email})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {iss.issue_date ? new Date(iss.issue_date).toLocaleDateString() : "--"}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-semibold">
                        {iss.due_date ? new Date(iss.due_date).toLocaleDateString() : "--"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            iss.status === "returned"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {iss.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right space-x-1">
                        {iss.status !== "returned" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedIssue(iss);
                                setReturnModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition"
                            >
                              Receive Return
                            </button>
                            <button
                              onClick={() => {
                                setSelectedIssue(iss);
                                setRenewModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition"
                            >
                              Renew
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: OVERDUE BOOKS */}
      {activeTab === "overdue" && isLibrarian && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <Loader text="Fetching overdue books..." />
          ) : overdueList.length === 0 ? (
            <div className="text-center py-16 px-4">
              <CheckCircle size={40} className="mx-auto text-emerald-400 mb-2" />
              <h3 className="text-sm font-bold text-slate-700">Zero Overdue Books</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All books currently in circulation are within their due dates.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-rose-50/50 border-b border-rose-100 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                    <th className="py-3 px-5">Overdue Title</th>
                    <th className="py-3 px-4">Student Details</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Days Overdue</th>
                    <th className="py-3 px-4 text-center">Fine (₹5/day)</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overdueList.map((item) => (
                    <tr key={item._id} className="hover:bg-rose-50/30 transition">
                      <td className="py-3 px-5">
                        <p className="font-bold text-slate-900">{item.book_title}</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.book_isbn}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{item.student_name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {item.student_email}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-rose-600 font-bold">
                        {item.due_date ? new Date(item.due_date).toLocaleDateString() : "--"}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-700">
                        {item.days_overdue} days
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-rose-600 font-mono">
                        ₹{item.fine_calculated}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <button
                          onClick={() => {
                            setSelectedIssue(item);
                            setReturnModalOpen(true);
                          }}
                          className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition"
                        >
                          Collect Return & Fine
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Book */}
      <Modal
        isOpen={addBookModalOpen}
        onClose={() => setAddBookModalOpen(false)}
        title="Add Book to Central Library Catalogue"
      >
        <form onSubmit={handleAddBookSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Book Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Introduction to Algorithms"
              value={bookForm.title}
              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Author(s) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Cormen, Leiserson"
                value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                ISBN Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 9780262033848"
                value={bookForm.isbn}
                onChange={(e) => setBookForm({ ...bookForm, isbn: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Artificial Intelligence">AI & Data Science</option>
                <option value="Electronics & Hardware">Electronics</option>
                <option value="Mechanical Engineering">Mechanical</option>
                <option value="Civil Engineering">Civil</option>
                <option value="Mathematics & Science">Mathematics</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Total Copies *
              </label>
              <input
                type="number"
                min="1"
                required
                value={bookForm.total_copies}
                onChange={(e) =>
                  setBookForm({ ...bookForm, total_copies: parseInt(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Shelf Location
              </label>
              <input
                type="text"
                placeholder="e.g. Rack CS-04"
                value={bookForm.shelf_location}
                onChange={(e) => setBookForm({ ...bookForm, shelf_location: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setAddBookModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Registering..." : "Add to Catalogue"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Issue Book */}
      <Modal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        title="Issue Book to Student"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Book Title *
            </label>
            <select
              required
              value={issueForm.book_id}
              onChange={(e) => setIssueForm({ ...issueForm, book_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            >
              <option value="">-- Choose Book from Catalogue --</option>
              {books
                .filter((b) => b.available_copies > 0)
                .map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title} (Available: {b.available_copies})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
              Select Eligible Student *
            </label>
            <select
              required
              value={issueForm.student_id}
              onChange={(e) => setIssueForm({ ...issueForm, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
            >
              <option value="">-- Choose Registered Student --</option>
              {studentOptions.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.first_name} {s.last_name || ""} ({s.enrollment_no || s.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Circulation Period (Days)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={issueForm.due_days}
                onChange={(e) =>
                  setIssueForm({ ...issueForm, due_days: parseInt(e.target.value) || 14 })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                Librarian Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes"
                value={issueForm.notes}
                onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-hidden focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIssueModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Issuing..." : "Confirm Checkout"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Return */}
      <Modal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Confirm Book Return"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Confirming the return of{" "}
            <span className="font-bold text-slate-900">
              "{selectedIssue?.book_title}"
            </span>{" "}
            borrowed by{" "}
            <span className="font-semibold text-slate-800">
              {selectedIssue?.student_name}
            </span>
            .
          </p>

          {selectedIssue?.due_date &&
            new Date() > new Date(selectedIssue.due_date) && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={15} /> Overdue Book Notice
                </p>
                <p>
                  This return is past the scheduled due date. Overdue fine of ₹5/day
                  will be recorded in the student's circulation audit.
                </p>
              </div>
            )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setReturnModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReturnSubmit}
              disabled={actionLoading}
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Confirm Return & Restock"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Renew Book */}
      <Modal
        isOpen={renewModalOpen}
        onClose={() => setRenewModalOpen(false)}
        title="Renew Book Due Date"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Extend borrowing period by 14 calendar days for{" "}
            <span className="font-bold text-slate-900">
              "{selectedIssue?.book_title}"
            </span>
            .
          </p>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setRenewModalOpen(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRenewSubmit}
              disabled={actionLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {actionLoading ? "Renewing..." : "Confirm 14-Day Renewal"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
