import { useState, useEffect } from "react";

function CreateProject({ onProjectCreated }) {
    // State for the required form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Planning"); // "Planning" is the default status
    const [projectLeadId, setProjectLeadId] = useState("");

    // 2. State to hold the fetched users and the success/error message
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState("");

    // Fetch users from the backend the moment this component loads
    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch("http://localhost:9000/users");
                const data = await response.json();
                setUsers(data); // Save the JSON array into React state
            } catch (error) {
                console.error("Failed to fetch users:", error);
            }
        }

        fetchUsers();
    }, []); // The empty array means "only run this once when the page loads"

    //  Handle form submission 
    async function handleSubmit(event) {
        event.preventDefault(); // Prevents the page from refreshing

        // Package the data matching what the backend expects
        const projectData = {
            name: name,
            description: description,
            status: status,
            project_lead_id: projectLeadId
        };

        try {
            const response = await fetch("http://localhost:9000/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(projectData),
            });

            const data = await response.json();
            setMessage(data.message);

            // If successful, instantly clear the form fields for a better user experience
            if (response.ok) {
                setName("");
                setDescription("");
                setStatus("Planning");
                setProjectLeadId("");

                onProjectCreated("");
            }
        } catch (error) {
            console.error("Error creating project:", error);
            setMessage("Failed to connect to the server.");
        }
    }

    return (
        <div>
            <h2>Create a New Project</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Project Name: </label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div>
                    <label>Description: </label>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>

                <div>
                    <label>Status: </label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="Planning">Planning</option>
                        <option value="Active">Active</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

                <div>
                    <label>Project Lead: </label>
                    <select value={projectLeadId} onChange={(e) => setProjectLeadId(e.target.value)}>
                        <option value="">-- Select a Project Lead --</option>
                        {/* Loop through the users state and create a dropdown option for each one */}
                        {users.map((user) => (
                            <option key={user._id} value={user._id}>
                                {user.username}
                            </option>
                        ))}
                    </select>
                </div>

                <button type="submit">Create Project</button>
            </form>

            {message && <p><strong>{message}</strong></p>}
        </div>
    );
}

export default CreateProject;