import { useState, useEffect } from "react";

function ProjectList({ refreshCounter }) {
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);

    // Fetch both Projects and Users when the component loads
    useEffect(() => {
        async function fetchData() {
            try {
                //  Fetch all projects
                const projResponse = await fetch("http://localhost:9000/projects");
                const projData = await projResponse.json();
                setProjects(projData);

                //  Fetch all users (so we can translate IDs to usernames)
                const userResponse = await fetch("http://localhost:9000/users");
                const userData = await userResponse.json();
                setUsers(userData);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        }

        fetchData();
    }, [refreshCounter]);


    //  Helper function to map the ID to a readable username
    function getLeadUsername(leadId) {
        // Find the user whose _id matches the project's project_lead_id
        const lead = users.find((user) => user._id === leadId);

        // If found, return their username. If not, return a fallback message.
        return lead ? lead.username : "Unknown User";
    }

    return (
        <div>
            <h2>All Projects</h2>
            {projects.length === 0 ? <p>No projects found.</p> : null}

            {projects.map((project) => (
                <div key={project._id} style={{ border: "1px solid gray", margin: "10px", padding: "15px" }}>
                    <h3>{project.name}</h3>
                    <p><strong>Description:</strong> {project.description}</p>
                    <p><strong>Status:</strong> {project.status}</p>
                    <p><strong>Project Lead:</strong> {getLeadUsername(project.project_lead_id)}</p>
                </div>
            ))}
        </div>
    );
}

export default ProjectList;