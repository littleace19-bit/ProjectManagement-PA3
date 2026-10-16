import { useState, useEffect } from "react";

function ProjectMembers() {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [memberships, setMemberships] = useState([]);
    const [userToAdd, setUserToAdd] = useState("");
    const [message, setMessage] = useState("");

    // 1. Fetch Projects and Users when the page loads
    useEffect(() => {
        async function fetchInitialData() {
            try {
                const projRes = await fetch("http://localhost:9000/projects");
                setProjects(await projRes.json());

                const userRes = await fetch("http://localhost:9000/users");
                setUsers(await userRes.json());
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
            }
        }
        fetchInitialData();
    }, []);

    // 2. Fetch Memberships dynamically WHENEVER a new project is selected
    useEffect(() => {
        if (!selectedProjectId) {
            setMemberships([]);
            return;
        }
        fetchMembers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProjectId]);

    async function fetchMembers() {
        try {
            const response = await fetch(`http://localhost:9000/projects/${selectedProjectId}/members`);
            setMemberships(await response.json());
        } catch (error) {
            console.error("Failed to fetch members:", error);
        }
    }

    // 3. Handle Adding a Member (POST)
    async function handleAddMember(e) {
        e.preventDefault();
        if (!userToAdd) return setMessage("Please select a user to add.");

        try {
            const response = await fetch(`http://localhost:9000/projects/${selectedProjectId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: userToAdd })
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                fetchMembers(); // Instantly refresh the list on success
                setUserToAdd(""); // Reset the dropdown
            }
        } catch (error) {
            setMessage("Server error while adding member.");
        }
    }

    // 4. Handle Removing a Member (DELETE)
    async function handleRemoveMember(userId) {
        try {
            const response = await fetch(`http://localhost:9000/projects/${selectedProjectId}/members/${userId}`, {
                method: "DELETE"
            });

            const data = await response.json();
            setMessage(data.message);

            if (response.ok) {
                fetchMembers(); // Instantly refresh the list on success
            }
        } catch (error) {
            setMessage("Server error while removing member.");
        }
    }

    // Helper to translate ID to Username
    function getUsername(userId) {
        const user = users.find(u => u._id === userId);
        return user ? user.username : "Unknown User";
    }

    return (
        <div>
            <h2>Manage Project Memberships</h2>

            {/* Select a Project */}
            <div style={{ marginBottom: "20px" }}>
                <label>Select Project: </label>
                <select value={selectedProjectId} onChange={(e) => {
                    setSelectedProjectId(e.target.value);
                    setMessage(""); // Clear messages when switching projects
                }}>
                    <option value="">-- Choose a Project --</option>
                    {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                </select>
            </div>

            {message && <p><strong>{message}</strong></p>}

            {/* Only show the rest if a project is actually selected */}
            {selectedProjectId && (
                <div style={{ border: "1px solid gray", padding: "15px", marginTop: "10px" }}>

                    {/* Add Member Form */}
                    <form onSubmit={handleAddMember} style={{ marginBottom: "20px" }}>
                        <label>Add User: </label>
                        <select value={userToAdd} onChange={(e) => setUserToAdd(e.target.value)}>
                            <option value="">-- Select a User --</option>
                            {users.map(u => (
                                <option key={u._id} value={u._id}>{u.username}</option>
                            ))}
                        </select>
                        <button type="submit" style={{ marginLeft: "10px" }}>Add Member</button>
                    </form>

                    {/* Current Members List */}
                    <h3>Current Members</h3>
                    {memberships.length === 0 ? <p>No members found.</p> : (
                        <ul>
                            {memberships.map(member => (
                                <li key={member._id} style={{ marginBottom: "10px" }}>
                                    {getUsername(member.user_id)}
                                    <button
                                        onClick={() => handleRemoveMember(member.user_id)}
                                        style={{ marginLeft: "15px", color: "red" }}
                                    >
                                        Remove
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProjectMembers;