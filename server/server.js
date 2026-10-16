require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb"); // ObjectId added for PA3
require("dotenv").config();

const app = express();

// Middleware to parse JSON and allow cross-origin requests
app.use(cors());
app.use(express.json());

// MongoDB connection setup
const client = new MongoClient(process.env.MONGO_URI);

// ---------------------------------------------------
// PA2 ROUTES: SIGNUP AND LOGIN
// ---------------------------------------------------

// POST route for Signup
app.post("/signup", async (req, res) => {
    const { f_name, l_name, username, password } = req.body;

    if (!f_name || !l_name || !username || !password) {
        return res.status(400).json({ message: "Required information is missing" });
    }

    try {
        const db = client.db("pa2");
        const users = db.collection("users");

        const existingUser = await users.findOne({ username: username });

        if (existingUser !== null) {
            return res.status(409).json({ message: "Username already exists" });
        }

        const newUser = {
            f_name: f_name,
            l_name: l_name,
            username: username,
            password: password
        };

        await users.insertOne(newUser);
        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST route for Login
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Required information is missing" });
    }

    try {
        const db = client.db("pa2");
        const users = db.collection("users");

        const user = await users.findOne({ username: username });

        if (user === null) {
            return res.status(401).json({ message: "Username does not exist" });
        }

        if (user.password !== password) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        res.status(200).json({ message: "Login successful!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
});



// GET route to fetch all registered users for dropdowns
app.get("/users", async (req, res) => {
    try {
        const db = client.db("pa2");
        const usersCollection = db.collection("users");

        // Fetch all users and convert them to an array
        const users = await usersCollection.find({}).toArray();

        // 200 status code means "Successful GET"
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error while fetching users" });
    }
});
// POST route to create a new project
app.post("/projects", async (req, res) => {
    const { name, description, status, project_lead_id } = req.body;

    //  Check required fields
    if (!name || !description || !status || !project_lead_id) {
        return res.status(400).json({ message: "All fields are required, including Project Lead" });
    }

    //  Validate the Project Lead ID format
    if (!ObjectId.isValid(project_lead_id)) {
        return res.status(400).json({ message: "Invalid Project Lead ID format" });
    }

    try {
        const db = client.db("pa2");
        const users = db.collection("users");
        const projects = db.collection("projects");
        const memberships = db.collection("projectMemberships");

        // Convert string ID to MongoDB ObjectId
        const leadIdObj = new ObjectId(project_lead_id);

        //  Verify that the selected user actually exists
        const userExists = await users.findOne({ _id: leadIdObj });
        if (!userExists) {
            return res.status(404).json({ message: "Selected Project Lead does not exist" });
        }

        //  Insert the Project document
        const newProject = {
            name: name,
            description: description,
            status: status,
            project_lead_id: leadIdObj // Stored as a strict ObjectId reference!
        };

        const projectResult = await projects.insertOne(newProject);
        const newProjectId = projectResult.insertedId; // Grab the newly generated Project ID

        //  Insert a Project Membership for the Project Lead
        const newMembership = {
            project_id: newProjectId,
            user_id: leadIdObj
        };
        await memberships.insertOne(newMembership);

        //  Return a success response (Status 201: Created)
        res.status(201).json({ message: "Project created successfully!" });

    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Server error while creating project" });
    }
});

// GET route to fetch all projects
app.get("/projects", async (req, res) => {
    try {
        const db = client.db("pa2");
        const projectsCollection = db.collection("projects");

        // Fetch all projects and convert them to an array
        const projects = await projectsCollection.find({}).toArray();

        // Send the projects back to the frontend (Status 200: Successful GET)
        res.status(200).json(projects);
    } catch (error) {
        console.error("Error fetching projects:", error);
        res.status(500).json({ message: "Server error while fetching projects" });
    }
});

// GET: Retrieve all members of a specific project
app.get("/projects/:projectId/members", async (req, res) => {
    try {
        const db = client.db("pa2");
        const projectIdObj = new ObjectId(req.params.projectId);

        // Find all membership records linked to this project
        const memberships = await db.collection("projectMemberships").find({ project_id: projectIdObj }).toArray();
        res.status(200).json(memberships);
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// POST: Add a new member to a project
app.post("/projects/:projectId/members", async (req, res) => {
    try {
        const db = client.db("pa2");
        const projectIdObj = new ObjectId(req.params.projectId);
        const userIdObj = new ObjectId(req.body.user_id); // Frontend sends the user's ID in the body

        // System Design Action: Duplicate Check
        const existingMembership = await db.collection("projectMemberships").findOne({
            project_id: projectIdObj,
            user_id: userIdObj
        });

        if (existingMembership) {
            return res.status(409).json({ message: "User is already a member of this project." });
        }

        // If no duplicate, create the membership
        await db.collection("projectMemberships").insertOne({
            project_id: projectIdObj,
            user_id: userIdObj
        });

        res.status(201).json({ message: "Member added successfully!" });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// DELETE: Remove a member from a project
app.delete("/projects/:projectId/members/:userId", async (req, res) => {
    try {
        const db = client.db("pa2");
        const projectIdObj = new ObjectId(req.params.projectId);
        const userIdObj = new ObjectId(req.params.userId);

        // System Design Action: Lead Protection Check
        const project = await db.collection("projects").findOne({ _id: projectIdObj });

        // Check if the user we are trying to delete is the project lead
        if (project && project.project_lead_id.toString() === userIdObj.toString()) {
            return res.status(400).json({ message: "Cannot remove the Project Lead from the project." });
        }

        // If they are not the lead, safely delete their membership document
        await db.collection("projectMemberships").deleteOne({
            project_id: projectIdObj,
            user_id: userIdObj
        });

        res.status(200).json({ message: "Member removed successfully!" });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// Start the backend server on port 9000
app.listen(9000, () => {
    console.log("Server is running on port 9000");
});