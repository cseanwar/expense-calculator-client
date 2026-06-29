import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';

// app.use(cors());
// Replace your old app.use(cors()) with this:
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://expense-calculator-client.vercel.app'  // add your actual frontend URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let expenseCollection: any;

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("expense_db");
    expenseCollection = db.collection("expense");

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // app.listen(port, () => {
    //   console.log(`SpendWise app listening on port ${port}`);
    // });

  } catch (error) {
    console.log('Failed to connect the database:', error);
    process.exit(1);
  }
}


app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// To get all expense data
app.get('/api/expense', async (req: Request, res: Response) => {
    try {
      const expense = await expenseCollection.find({}).sort({ date: -1 }).toArray();
      res.status(200).json(expense);
    } catch (error) {
      res.status(500).json({ message: 'Error retrieving expense data' });
    }
});

// To create or update expense data using POST method
app.post('/api/expense', async (req: Request, res: Response) => {
  try {
    const { title, amount, category, date } = req.body;

    const newExpense = {
        title: title? title.trim() : 'Untitled',
        amount: Number(amount),
        category,
        date,
        createdAt: new Date(),
    }

    const result = await expenseCollection.insertOne(newExpense);
    res.status(201).json({ _id: result.insertedId, ...newExpense });
  } catch (error) {
    res.status(500).json({ message: 'Error creating or updating expense data' });
  }
});

// To update existing expense data using PUT method
app.put('/api/expense/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }

    const { title, amount, category, date } = req.body;

    const updatedExpense = {
      title: title ? title.trim() : 'Untitled',
      amount: Number(amount),
      category,
      date,
    };

    const result = await expenseCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedExpense }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Return the updated item back to the frontend
    res.status(200).json({ _id: id, ...updatedExpense });
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense data' });
  }
});

// To delete an expense data using DELETE method by id
app.delete('/api/expense/:id', async (req: Request, res: Response): Promise<any> => {
  try {
    const id = req.params.id as string;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ObjectId' });
    }
    const result = await expenseCollection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.status(200).json({ message: `Expense with id ${id} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense data' });
  }
});

run();
export default app;