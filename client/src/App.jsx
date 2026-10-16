import { useState } from "react";
import Signup from "./components/Signup";
import Login from "./components/Login";
import CreateProject from "./components/CreateProject";
import ProjectList from "./components/ProjectList";
import ProjectMembers from "./components/ProjectMembers"; // <-- Import added

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div>
      <h1>User Login & Project Management</h1>
      <hr />
      <Signup />
      <hr />
      <Login />
      <hr />
      <CreateProject onProjectCreated={() => setRefreshTrigger(refreshTrigger + 1)} />
      <hr />
      <ProjectList refreshCounter={refreshTrigger} />
      <hr />
      <ProjectMembers /> {/* <-- Component added */}
    </div>
  );
}

export default App;