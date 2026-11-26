const express = require("express");
const cors = require("cors");
require ("dotenv").config();
const connectDB = require("./config/db")
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");


const app = express()

app.use(cors())
app.use(express.json())
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);

app.get("/" , (req, res) => {
    res.send("Backend is running");
});

const PORT = process.env.PORT || 5000;
const startServer = async()=>{
    await connectDB()



app.listen(PORT , ()=>{
    console.log(`server is running on port ${PORT}`)
})
}
startServer()