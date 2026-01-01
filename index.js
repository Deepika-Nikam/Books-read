import express from "express";
import bodyParser from "body-parser";
import 'dotenv/config'; 
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", async (req, res) => {
    const searchQuery = req.query.search || ""; // Get the search term from the URL
    
    try {
        let query = "SELECT * FROM books";
        let params = [];

        if (searchQuery) {
            // Filter by title or author
            query += " WHERE title ILIKE $1 OR author ILIKE $1";
            params.push(`%${searchQuery}%`);
        }

        query += " ORDER BY date_read DESC;";
        
        const result = await db.query(query, params);
        
        res.render("index.ejs", {
            bookItems: result.rows,
            searchQuery: searchQuery // Pass this back to keep the text in the input box
        });
    } catch (err) {
        console.error("Error executing query", err.stack);
        res.status(500).send("Server Error");
    }
});

app.get("/add", (req, res) => {
    res.render("add.ejs");
});

app.post("/add", async (req,res) => {
    const title = req.body.title;
    const author = req.body.author;
    const rating = req.body.rating;
    const review = req.body.review;
    const notes = req.body.notes;
    const date_read = req.body.date_read;
    const isbn = req.body.isbn;

    try{
        await db.query("INSERT INTO books (title, author, isbn, rating, review, notes, date_read) VALUES ($1, $2, $3, $4, $5, $6, $7)", [title, author, isbn, rating, review, notes, date_read]);
        res.redirect("/");
    }
    catch (err) {
        console.log(err);
    }   
});

app.get("/edit/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const result = await db.query("SELECT * FROM books WHERE id = $1", [id]);
        res.render("edit.ejs", { book: result.rows[0] });
    } catch (err) {
        console.log(err);
        res.redirect("/");
    }
});

app.post("/edit" , async(req,res)=>{
    const id = req.body.updateBookId;
    const title = req.body.updateTitle;
    const author = req.body.updateAuthor;
    const rating = req.body.updateRating;
    const review = req.body.updateReview;
    const notes = req.body.updateNotes;
    const date_read = req.body.updateDateRead;

    try{
        await db.query("UPDATE books SET title=$1, author=$2, rating=$3, review=$4, notes=$5, date_read=$6 WHERE id=$7", [title, author, rating, review, notes, date_read, id]);
        res.redirect("/");
    }
    catch (err){
        console.log(err);
    }
});

app.post("/delete", async (req, res) => {
    const id = req.body.deleteBookId;
    try{
        db.query("DELETE FROM books WHERE id = $1", [id]);
        res.redirect("/");
    }
    catch (err)
    {
        console.log(err);
    }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});