# Athenaeum: Student Book Exchange

**Design and Development of a Web-Based Book Exchange System for Students**

A full-stack web application that works as a digital library and book-exchange platform for students. You can browse a shelf of books, search and filter the catalogue, add your own books (with cover images), and request books from other students. The owner of a book can accept or reject each request.

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Frontend   | React 19 + Vite, Tailwind CSS v4, Lucide React icons     |
| Backend    | Node.js + Express 5 (REST API, JSON)                     |
| Database   | **SQLite** via [sql.js](https://sql.js.org) (no database server or app needed) |
| Uploads    | Multer (cover images saved to `server/uploads/`)         |

> **You do not need MySQL, MySQL Workbench or any other database program.**
> The SQLite database is a single file that the backend creates and fills with sample data the first time it starts.

---

## 1. Required software

- **Node.js 20.19 or newer** (Node 22 LTS recommended). Download it from <https://nodejs.org>. npm comes with Node.js.
- Check your versions:
  ```bash
  node -v
  npm -v
  ```

No C++ compiler or build tools are needed. sql.js is SQLite compiled to WebAssembly, so `npm install` works the same way on Windows, macOS and Linux.

## 2. Download the project

Use Git:

```bash
git clone https://github.com/nasaivedanth1204/Design-and-Development-of-a-Web-Based-Book-Exchange-System-for-Students.git
cd Design-and-Development-of-a-Web-Based-Book-Exchange-System-for-Students
```

Or, on GitHub, click **Code → Download ZIP**, unzip the file, and open a terminal inside the unzipped folder.

## 3. Install dependencies (one time)

Run this from the **project root folder**:

```bash
npm install
```

It installs everything for the root, `client/` and `server/` in one go, because the project uses npm workspaces.

## 4. Start the application

```bash
npm run dev
```

This single command starts **both** servers:

| What               | URL                          |
| ------------------ | ---------------------------- |
| Website (open this) | **http://localhost:5173**   |
| REST API           | http://localhost:4000/api    |

Open **http://localhost:5173** in your browser. Press **Ctrl + C** in the terminal to stop both servers.

On first start the terminal shows something like:

```
[api] ✔ SQLite database ready: .../server/data/books.db
[api]   First run — created tables and inserted 50 sample books.
[api] ✔ API server running at http://localhost:4000/api
[web]   ➜  Local:   http://localhost:5173/
```

### Other commands

| Command            | What it does                                                                |
| ------------------ | --------------------------------------------------------------------------- |
| `npm run dev`      | Starts frontend + backend for development (the command you normally use).   |
| `npm run build`    | Builds the optimised React app into `client/dist/`.                         |
| `npm start`        | Builds the app, then serves the website **and** API together at http://localhost:4000. |
| `npm test`         | Runs the automated API tests against a temporary database. Your demo data is not touched. |
| `npm run reset-db` | Deletes the database and uploaded covers so the sample data is recreated on the next start. |

## 5. How the database is set up automatically

You never create tables or run SQL by hand. When the backend starts, `server/src/db.js`:

1. Opens `server/data/books.db`, or creates the file if it does not exist.
2. Turns on foreign-key enforcement with `PRAGMA foreign_keys = ON`.
3. Runs `CREATE TABLE IF NOT EXISTS …` for the two tables (see `server/src/schema.js`).
4. On the **first run only**, inserts 50 sample books and 3 sample requests in one transaction, then records this in the database header (`PRAGMA user_version = 1`). Later restarts skip this step, so seed data is never duplicated, and books you added or deleted stay that way.

Every successful insert, update or delete is written straight back to `books.db`. That is why your data survives page refreshes and server restarts.

### Where the database file is stored

```
server/data/books.db      ← the SQLite database (created automatically)
server/uploads/           ← uploaded cover images (only the path is stored in SQLite)
```

Both locations are listed in `.gitignore`, so your local demo data is never committed. If you are curious, you can open `books.db` with any SQLite viewer, but you don't need one.

### Database schema (two tables)

**Books**: `id`, `title` (required), `author` (required), `publisher`, `publicationYear`, `genre`, `coverImage`, `description`, `ownerId`, `ownerName`, `exchangePreference` (`exchange` / `lend` / `give away` / `sell`), `price`, `status` (`available` / `reserved` / `unavailable`), `createdAt`, `updatedAt`.

**BookRequests**: `id`, `bookId` → `Books.id` (foreign key, `ON DELETE CASCADE`), `requesterId`, `requesterName`, `ownerId`, `ownerName`, `requestType` (`borrow` / `exchange` / `purchase`), `message`, `status` (`pending` / `accepted` / `rejected` / `cancelled`), `createdAt`, `updatedAt`.

- Optional fields left blank are stored as real SQL `NULL`, never as `"null"` or `"-"`. The UI shows "—" for them.
- `CHECK` constraints only allow valid values for preferences, statuses and years.
- A partial unique index stops the same student from having two *pending* requests for the same book.
- There is **no Users table** and no login. The mock students are a fixed list in `server/src/constants.js`.

## 6. Demonstration walkthrough

The **"Acting as"** selector at the top right lets you switch between six mock students (Aarav, Priya, Rahul, Sneha, Kabir, Ananya). It simulates different users without needing accounts.

**Browse and search**
1. The Library page shows the *Recently added* shelf and the full collection on wooden shelves.
2. Type in the search bar, for example `orwell`, `  MIT press `, `1997` or `mathematics`. Search is case-insensitive and ignores extra spaces.
3. Click a category chip such as *Computer Science*, change **Sort by** or the **Listed for** / **Availability** filters, then click **Reset filters**.
4. Search for something that doesn't exist to see the empty state.

**Add a book**
1. Acting as *Aarav Sharma*, click **Add a Book**.
2. Fill in every field and upload a cover image (JPG, PNG, WEBP or GIF, up to 3 MB) or paste an image URL. Choose **Sell** to enter a price. Click **Add to library**.
3. The book appears immediately under *Recently added*. Search for it, filter by its category, then refresh the page. It is still there, because it was saved in SQLite.
4. Add a second book with **only** a title and author. Open it to see "—" for the missing details.

**Request a book**
1. Switch "Acting as" to *Rahul Verma*.
2. Open Aarav's new book, click **Request This Book**, pick a request type, add a message, and send it.
3. Open the book again. It says your request is pending. Try sending a second request: the app does not allow duplicates.
4. **Book Requests → Sent by me** shows the request as *pending*.

**Accept or reject**
1. Switch back to *Aarav Sharma*. The **Book Requests** tab has a badge with the number of pending requests.
2. Under **Incoming**, click **Accept**. The book becomes **reserved**, and any other pending requests for it are declined automatically. Reject another request to see the *rejected* status.
3. Switch to Rahul again: **Sent by me** now shows *accepted*.

**Edit and delete**
- Under **Book Requests → My listings** (or in a book's details), the owner can **Edit** a book, including changing its availability back to *available*, or **Delete** it after confirming. Deleting a book also deletes its requests.

**Persistence check**: stop the servers with Ctrl + C, run `npm run dev` again, and everything you did is still there.

## 7. Business rules (enforced by the server)

- A student cannot request their own book.
- Only *available* books can be requested.
- One pending request per student per book.
- Only the owner can accept or reject a request, only the requester can cancel it, and only *pending* requests can change.
- Accepting a request reserves the book, and a reserved book cannot have another request accepted.
- Only the owner can edit or delete a book.

Identity is simulated with the "Acting as" selector. This is for academic demonstration and is not secure authentication.

## 8. Resetting the demo data

1. Stop the servers (Ctrl + C).
2. Run:
   ```bash
   npm run reset-db
   ```
3. Run `npm run dev`. The tables and the 50 sample books are created again.

(`reset-db` refuses to run while the server is still running, because the running server would write the old data back.)

## 9. REST API reference

| Method | Endpoint                               | Purpose                                         |
| ------ | -------------------------------------- | ----------------------------------------------- |
| GET    | `/api/books?search=&genre=&preference=&status=&sort=` | List, search, filter and sort books (`sort`: `recent`, `title`, `author`, `year-new`, `year-old`) |
| GET    | `/api/books/:id`                       | One book                                        |
| GET    | `/api/books/owner/:ownerId`            | Books listed by one owner                       |
| POST   | `/api/books`                           | Add a book (multipart form, optional `coverFile`) |
| PUT    | `/api/books/:id`                       | Edit a book (owner only; send `actorId`)        |
| DELETE | `/api/books/:id?actorId=`              | Delete a book and its requests (owner only)     |
| POST   | `/api/requests`                        | Create a request `{ bookId, requesterId, requestType, message }` |
| GET    | `/api/requests/incoming/:ownerId`      | Requests received by an owner                   |
| GET    | `/api/requests/outgoing/:requesterId`  | Requests sent by a student                      |
| PATCH  | `/api/requests/:id/status`             | `{ status: accepted / rejected / cancelled, actorId }` |
| GET    | `/api/meta`                            | Mock owners, categories and allowed values      |

Responses use the usual status codes: `200`/`201` for success, `400` for validation errors (with per-field `details`), `403` when the wrong user tries an action, `404` when something is not found, and `409` for business-rule conflicts. Every SQL statement is parameterized, and error responses never include stack traces or database internals.

## 10. Project structure

```
├── package.json            Root scripts (npm run dev / build / start / test / reset-db)
├── client/                 React + Vite frontend
│   ├── vite.config.js      Dev server on :5173, proxies /api and /uploads to :4000
│   └── src/
│       ├── App.jsx         App state, data loading, modals
│       ├── api.js          fetch wrapper for the REST API
│       ├── pages/          LibraryPage, CategoriesPage, RequestsPage
│       └── components/     BookCard, BookCover (with fallback), modals, navbar…
└── server/                 Express backend
    ├── src/
    │   ├── index.js        Startup: initialise DB, start server, friendly errors
    │   ├── app.js          Express app, routes, error handler
    │   ├── db.js           SQLite connection, save-to-file, transactions
    │   ├── schema.js       CREATE TABLE statements
    │   ├── seed.js / seedData.js   50 sample books (first run only)
    │   ├── validation.js   Input validation and cleaning
    │   ├── upload.js       Multer config for cover images
    │   └── routes/         books.js, requests.js
    ├── scripts/reset-db.js
    ├── test/api.test.js    Automated API tests (npm test)
    ├── data/               books.db lives here (git-ignored)
    └── uploads/            uploaded covers (git-ignored)
```

## 11. Cover images

Sample books use real covers from the **Open Library Covers API** (`covers.openlibrary.org`), matched by ISBN. If a cover can't be loaded (no internet during the demo, a missing image, or a broken URL), the app draws its own cloth-bound style cover showing the title and author, so the page never shows a broken image. A few sample books deliberately have no cover so you can see this.

## 12. Troubleshooting

| Problem | Fix |
| ------- | --- |
| `Port 4000 is already in use` | The server is already running in another terminal. Stop it with Ctrl + C, or use another port: `PORT=4001 npm run dev` (macOS/Linux) or `set PORT=4001 && npm run dev` (Windows cmd). |
| Page says "Cannot reach the server" | Make sure `npm run dev` is running and shows `API server running`. Then click **Try again**. |
| `Could not initialise the SQLite database` | The database file is damaged. Stop the server, run `npm run reset-db`, and start again. |
| `npm install` errors about the Node version | Install Node.js 20.19+ (22 LTS recommended). |
