// Sample catalogue inserted the first time the server starts.
// Covers come from the Open Library Covers API (looked up by ISBN). The
// "?default=false" flag makes Open Library return a 404 instead of a blank
// image when it has no cover, so the UI can switch to its built-in fallback.
// A few books intentionally have no ISBN/cover or missing metadata to show
// how NULL values and fallback covers are handled.

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

export const SEED_BOOKS = [
  // ── Fiction ─────────────────────────────────────────────
  { title: '1984', author: 'George Orwell', publisher: 'Signet Classic', publicationYear: 1949, genre: 'Fiction', isbn: '9780451524935', owner: 'aarav', preference: 'exchange',
    description: 'A chilling portrait of a totalitarian state where Big Brother watches everyone and truth itself is rewritten by the Party.' },
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', publisher: 'Harper Perennial', publicationYear: 1960, genre: 'Fiction', isbn: '9780060935467', owner: 'priya', preference: 'lend',
    description: 'Scout Finch grows up in Depression-era Alabama as her father defends a Black man falsely accused of a crime.' },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', publisher: 'Scribner', publicationYear: 1925, genre: 'Fiction', isbn: '9780743273565', owner: 'rahul', preference: 'sell', price: 150,
    description: 'Jay Gatsby’s lavish parties and longing for Daisy Buchanan expose the hollowness at the heart of the Jazz Age.' },
  { title: 'The Hobbit', author: 'J.R.R. Tolkien', publisher: 'Houghton Mifflin Harcourt', publicationYear: 1937, genre: 'Fiction', isbn: '9780547928227', owner: 'sneha', preference: 'lend',
    description: 'Bilbo Baggins is swept from his comfortable hobbit-hole into a quest for dragon-guarded treasure.' },
  { title: 'The Alchemist', author: 'Paulo Coelho', publisher: 'HarperOne', publicationYear: 1988, genre: 'Fiction', isbn: '9780062315007', owner: 'kabir', preference: 'give away',
    description: 'A young Andalusian shepherd travels to Egypt in search of treasure and discovers the meaning of his Personal Legend.' },
  { title: 'The Catcher in the Rye', author: 'J.D. Salinger', publisher: 'Little, Brown and Company', publicationYear: 1951, genre: 'Fiction', isbn: '9780316769488', owner: 'ananya', preference: 'exchange',
    description: 'Holden Caulfield wanders New York City for three days, railing against the phoniness of the adult world.' },
  { title: 'Brave New World', author: 'Aldous Huxley', publisher: 'Harper Perennial', publicationYear: 1932, genre: 'Fiction', isbn: '9780060850524', owner: 'aarav', preference: 'sell', price: 180,
    description: 'In a world engineered for comfort and stability, one man begins to question the price of happiness.' },
  { title: 'Dune', author: 'Frank Herbert', publisher: 'Ace Books', publicationYear: 1965, genre: 'Fiction', isbn: '9780441172719', owner: 'priya', preference: 'exchange',
    description: 'Paul Atreides is drawn into the politics, ecology and prophecy of the desert planet Arrakis.' },

  // ── Literature ──────────────────────────────────────────
  { title: 'Pride and Prejudice', author: 'Jane Austen', publisher: 'Penguin Classics', publicationYear: 1813, genre: 'Literature', isbn: '9780141439518', owner: 'rahul', preference: 'lend',
    description: 'Elizabeth Bennet and Mr Darcy spar their way past first impressions in Austen’s sharpest comedy of manners.' },
  { title: 'Crime and Punishment', author: 'Fyodor Dostoevsky', publisher: 'Vintage Classics', publicationYear: 1866, genre: 'Literature', isbn: '9780679734505', owner: 'sneha', preference: 'exchange',
    description: 'A destitute former student commits a murder and is consumed by guilt in the streets of St Petersburg.' },
  { title: 'One Hundred Years of Solitude', author: 'Gabriel García Márquez', publisher: 'Harper Perennial', publicationYear: 1967, genre: 'Literature', isbn: '9780060883287', owner: 'kabir', preference: 'lend',
    description: 'Seven generations of the Buendía family rise and fall in the magical town of Macondo.' },
  { title: 'Jane Eyre', author: 'Charlotte Brontë', publisher: 'Penguin Classics', publicationYear: 1847, genre: 'Literature', isbn: '9780141441146', owner: 'ananya', preference: 'give away',
    description: 'An orphaned governess finds love at Thornfield Hall — and a secret locked away in its attic.' },
  { title: 'Things Fall Apart', author: 'Chinua Achebe', publisher: 'Anchor Books', publicationYear: 1958, genre: 'Literature', isbn: '9780385474542', owner: 'aarav', preference: 'lend',
    description: 'Okonkwo, a proud Igbo leader, watches his world unravel with the arrival of colonial rule.' },
  { title: 'The God of Small Things', author: 'Arundhati Roy', publisher: 'Random House', publicationYear: 1997, genre: 'Literature', isbn: '9780812979657', owner: 'priya', preference: 'exchange',
    description: 'Twins Estha and Rahel piece together a childhood tragedy in 1960s Kerala.' },

  // ── Science ─────────────────────────────────────────────
  { title: 'A Brief History of Time', author: 'Stephen Hawking', publisher: 'Bantam', publicationYear: 1988, genre: 'Science', isbn: '9780553380163', owner: 'rahul', preference: 'exchange',
    description: 'From the Big Bang to black holes, Hawking explains the nature of space and time for everyday readers.' },
  { title: 'Cosmos', author: 'Carl Sagan', publisher: 'Ballantine Books', publicationYear: 1980, genre: 'Science', isbn: '9780345539434', owner: 'sneha', preference: 'sell', price: 250,
    description: 'Sagan’s lyrical tour of the universe and of the scientific journey that revealed it.' },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', publisher: 'Oxford University Press', publicationYear: 1976, genre: 'Science', isbn: '9780198788607', owner: 'kabir', preference: 'lend',
    description: 'A gene’s-eye view of evolution that introduced the idea of the meme.' },
  { title: 'On the Origin of Species', author: 'Charles Darwin', publisher: 'Signet Classics', publicationYear: 1859, genre: 'Science', isbn: '9780451529060', owner: 'ananya', preference: 'give away',
    description: 'The founding text of evolutionary biology, setting out the theory of natural selection.' },
  { title: 'The Gene: An Intimate History', author: 'Siddhartha Mukherjee', publisher: 'Scribner', publicationYear: 2016, genre: 'Science', isbn: '9781476733524', owner: 'aarav', preference: 'exchange',
    description: 'The story of the gene from Mendel’s peas to CRISPR, interwoven with the author’s family history.' },

  // ── Technology ──────────────────────────────────────────
  { title: 'The Pragmatic Programmer', author: 'David Thomas, Andrew Hunt', publisher: 'Addison-Wesley', publicationYear: 2019, genre: 'Technology', isbn: '9780135957059', owner: 'priya', preference: 'lend',
    description: 'Timeless, practical advice on becoming a more effective and adaptable software developer.' },
  { title: 'Clean Code', author: 'Robert C. Martin', publisher: 'Prentice Hall', publicationYear: 2008, genre: 'Technology', isbn: '9780132350884', owner: 'aarav', preference: 'lend',
    description: 'A handbook of agile software craftsmanship: naming, functions, tests and refactoring.' },
  { title: 'The Innovators', author: 'Walter Isaacson', publisher: 'Simon & Schuster', publicationYear: 2014, genre: 'Technology', isbn: '9781476708706', owner: 'rahul', preference: 'exchange',
    description: 'How a group of hackers, geniuses and geeks created the digital revolution.' },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', publisher: 'O’Reilly Media', publicationYear: 2017, genre: 'Technology', isbn: '9781449373320', owner: 'sneha', preference: 'sell', price: 900,
    description: 'The big ideas behind reliable, scalable and maintainable data systems.' },
  { title: 'Eloquent JavaScript', author: 'Marijn Haverbeke', publisher: 'No Starch Press', publicationYear: 2018, genre: 'Technology', isbn: '9781593279509', owner: 'kabir', preference: 'exchange',
    description: 'A modern introduction to programming through the language of the web.' },

  // ── Computer Science ────────────────────────────────────
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein', publisher: 'MIT Press', publicationYear: 2009, genre: 'Computer Science', isbn: '9780262033848', owner: 'ananya', preference: 'sell', price: 1200,
    description: 'The classic CLRS reference on algorithm design and analysis, used in courses worldwide.' },
  { title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson, Gerald Jay Sussman', publisher: 'MIT Press', publicationYear: 1996, genre: 'Computer Science', isbn: '9780262510875', owner: 'aarav', preference: 'lend',
    description: 'The legendary “wizard book” that teaches programming as a way of thinking.' },
  { title: 'The C Programming Language', author: 'Brian W. Kernighan, Dennis M. Ritchie', publisher: 'Prentice Hall', publicationYear: 1988, genre: 'Computer Science', isbn: '9780131103627', owner: 'priya', preference: 'exchange',
    description: 'K&R — the concise, authoritative guide to C from the people who created it.' },
  { title: 'Code: The Hidden Language of Computer Hardware and Software', author: 'Charles Petzold', publisher: 'Microsoft Press', publicationYear: 2000, genre: 'Computer Science', isbn: '9780735611313', owner: 'rahul', preference: 'lend',
    description: 'From Morse code and light bulbs to a working computer, built up one idea at a time.' },
  { title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell, Peter Norvig', publisher: 'Pearson', publicationYear: 2009, genre: 'Computer Science', isbn: '9780136042594', owner: 'sneha', preference: 'sell', price: 950,
    description: 'The leading textbook on artificial intelligence, from search to machine learning.' },
  { title: 'Computer Networking: A Top-Down Approach', author: 'James F. Kurose, Keith W. Ross', publisher: 'Pearson', publicationYear: 2012, genre: 'Computer Science', isbn: '9780132856201', owner: 'kabir', preference: 'exchange',
    description: 'Networking explained from the application layer down to the physical link.' },
  { title: 'Data Structures Lab Notes (Semester 3)', author: 'Rahul Verma', publisher: null, publicationYear: null, genre: 'Computer Science', isbn: null, owner: 'rahul', preference: 'give away',
    description: 'Handwritten, neatly indexed notes covering linked lists, trees, graphs and hashing with solved lab programs.' },

  // ── Engineering ─────────────────────────────────────────
  { title: 'The Design of Everyday Things', author: 'Don Norman', publisher: 'Basic Books', publicationYear: 2013, genre: 'Engineering', isbn: '9780465050659', owner: 'ananya', preference: 'lend',
    description: 'Why some products satisfy while others frustrate — the foundations of human-centred design.' },
  { title: 'To Engineer Is Human', author: 'Henry Petroski', publisher: 'Vintage Books', publicationYear: 1992, genre: 'Engineering', isbn: '9780679734161', owner: 'aarav', preference: 'exchange',
    description: 'What failures — from bridges to buildings — teach us about successful design.' },
  { title: 'Engineering Mechanics: Statics', author: 'J.L. Meriam, L.G. Kraige', publisher: 'Wiley', publicationYear: 2012, genre: 'Engineering', isbn: null, owner: 'priya', preference: 'sell', price: 400,
    description: 'First-year statics textbook with worked examples on forces, equilibrium, trusses and friction.' },

  // ── Mathematics ─────────────────────────────────────────
  { title: 'Gödel, Escher, Bach', author: 'Douglas R. Hofstadter', publisher: 'Basic Books', publicationYear: 1979, genre: 'Mathematics', isbn: '9780465026562', owner: 'rahul', preference: 'lend',
    description: 'An eternal golden braid of logic, art and music exploring how minds arise from meaningless symbols.' },
  { title: 'How to Solve It', author: 'George Pólya', publisher: 'Princeton University Press', publicationYear: 1945, genre: 'Mathematics', isbn: '9780691164076', owner: 'sneha', preference: 'exchange',
    description: 'A short, practical guide to the art of mathematical problem solving.' },
  { title: 'Fermat’s Enigma', author: 'Simon Singh', publisher: 'Anchor Books', publicationYear: 1997, genre: 'Mathematics', isbn: '9780385493628', owner: 'kabir', preference: 'give away',
    description: 'The 358-year quest to prove Fermat’s Last Theorem, told as a thrilling human story.' },
  { title: 'Calculus', author: 'Michael Spivak', publisher: 'Publish or Perish', publicationYear: 2008, genre: 'Mathematics', isbn: '9780914098911', owner: 'ananya', preference: 'lend',
    description: 'A rigorous, beautifully written introduction to calculus and real analysis.' },

  // ── History ─────────────────────────────────────────────
  { title: 'Sapiens: A Brief History of Humankind', author: 'Yuval Noah Harari', publisher: 'Harper', publicationYear: 2015, genre: 'History', isbn: '9780062316097', owner: 'aarav', preference: 'exchange',
    description: 'How Homo sapiens came to dominate the planet, from the cognitive revolution to today.' },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', publisher: 'W. W. Norton & Company', publicationYear: 1997, genre: 'History', isbn: '9780393317558', owner: 'priya', preference: 'lend',
    description: 'Why did history unfold differently on different continents? Geography holds many of the answers.' },
  { title: 'The Discovery of India', author: 'Jawaharlal Nehru', publisher: 'Penguin Books', publicationYear: 1946, genre: 'History', isbn: '9780143031031', owner: 'rahul', preference: 'exchange',
    description: 'Written in prison, Nehru’s sweeping reflection on India’s history, culture and philosophy.' },
  { title: 'India After Gandhi', author: 'Ramachandra Guha', publisher: 'Harper Perennial', publicationYear: 2007, genre: 'History', isbn: '9780060958589', owner: 'sneha', preference: 'sell', price: 450,
    description: 'The history of the world’s largest democracy from independence to the present.' },

  // ── Business ────────────────────────────────────────────
  { title: 'Zero to One', author: 'Peter Thiel, Blake Masters', publisher: 'Crown Business', publicationYear: 2014, genre: 'Business', isbn: '9780804139298', owner: 'kabir', preference: 'sell', price: 220,
    description: 'Notes on startups, or how to build companies that create genuinely new things.' },
  { title: 'The Lean Startup', author: 'Eric Ries', publisher: 'Crown Business', publicationYear: 2011, genre: 'Business', isbn: '9780307887894', owner: 'ananya', preference: 'exchange',
    description: 'Build, measure, learn: a scientific approach to creating and managing startups.' },
  { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', publisher: 'Farrar, Straus and Giroux', publicationYear: 2011, genre: 'Business', isbn: '9780374533557', owner: 'aarav', preference: 'lend',
    description: 'The two systems that drive the way we think — and the biases that lead us astray.' },

  // ── Self-Help ───────────────────────────────────────────
  { title: 'Atomic Habits', author: 'James Clear', publisher: 'Avery', publicationYear: 2018, genre: 'Self-Help', isbn: '9780735211292', owner: 'rahul', preference: 'sell', price: 300,
    description: 'Tiny changes, remarkable results: a proven framework for building good habits.' },
  { title: 'The 7 Habits of Highly Effective People', author: 'Stephen R. Covey', publisher: 'Free Press', publicationYear: 1989, genre: 'Self-Help', isbn: '9780743269513', owner: 'sneha', preference: 'lend',
    description: 'A principle-centred approach to solving personal and professional problems.' },
  { title: 'Deep Work', author: 'Cal Newport', publisher: 'Grand Central Publishing', publicationYear: 2016, genre: 'Self-Help', isbn: '9781455586691', owner: 'kabir', preference: 'exchange',
    description: 'Rules for focused success in a distracted world — essential reading before exam season.' },

  // ── Other ───────────────────────────────────────────────
  { title: 'The Elements of Style', author: 'William Strunk Jr., E.B. White', publisher: 'Pearson', publicationYear: 1999, genre: 'Other', isbn: '9780205309023', owner: 'ananya', preference: 'give away',
    description: 'The pocket-sized classic on writing clear, concise English.' },
  { title: 'Hostel Kitchen: Cooking on a Student Budget', author: 'Campus Cooking Club', publisher: null, publicationYear: null, genre: 'Other', isbn: null, owner: 'kabir', preference: 'give away',
    description: null },
];

// A few pending requests so the "Book Requests" dashboard is not empty on day one.
export const SEED_REQUESTS = [
  { bookTitle: 'Clean Code', requester: 'priya', requestType: 'borrow', message: 'Need this for my software engineering mini-project. I can return it in two weeks!' },
  { bookTitle: 'Sapiens: A Brief History of Humankind', requester: 'rahul', requestType: 'exchange', message: 'Happy to swap my copy of The Discovery of India for this.' },
  { bookTitle: 'Atomic Habits', requester: 'sneha', requestType: 'purchase', message: null },
];

export const coverFor = (isbn) => (isbn ? cover(isbn) : null);
