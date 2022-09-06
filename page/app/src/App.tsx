import React, { useState } from "react";
import { Drawer } from "./components/Drawer";
import { Docs } from "./components/Docs";
import { NavBar } from "./components/NavBar";
import Badges from "./content/badges.mdx";
import Introduction from "./content/introduction.mdx";
import { Action, State } from "./interfaces";

export function App() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = ({ isOpen }: any) => setIsOpen(!isOpen);

  return (
    <main className="App main">
      <Drawer isOpen={isOpen} handler={toggleDrawer}>
        <NavBar isOpen={isOpen} handler={toggleDrawer} />
        <Docs Component={Badges} />
        <Docs Component={Introduction} />
      </Drawer>
    </main>
  );
}

export default App;
