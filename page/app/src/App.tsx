import React, { useState } from "react";
import { Drawer } from "./components/Drawer";
import { Docs } from "./components/Docs";
import { NavBar } from "./components/NavBar";
import Badges from "./content/badges.mdx";
import Introduction from "./content/introduction.mdx";
import Synopsis from "./content/synopsis.mdx";
import HowItWorks from "./content/how-it-works.mdx";
import Install from "./content/install.mdx";
import Usage from "./content/usage.mdx";
import ObjectAnatomy from "./content/object-anatomy.mdx";
import LifeCycle from "./content/lifecycle.mdx";
import Review from "./content/review.mdx";
import Update from "./content/update.mdx";
import RoadMap from "./content/roadmap.mdx";
import Footer from "./content/footer.mdx";

export function App() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = ({ isOpen }: any) => setIsOpen(!isOpen);

  return (
    <main className="App main">
      <Drawer isOpen={isOpen} handler={toggleDrawer}>
        <NavBar isOpen={isOpen} handler={toggleDrawer} />
        <Docs Component={Badges} />
        <Docs Component={Introduction} />
        <Docs Component={Synopsis} />
        <Docs Component={HowItWorks} />
        <Docs Component={Install} />
        <Docs Component={Usage} />
        <Docs Component={ObjectAnatomy} />
        <Docs Component={LifeCycle} />
        <Docs Component={Review} />
        <Docs Component={Update} />
        <Docs Component={RoadMap} />
        <Docs Component={Footer} />
      </Drawer>
    </main>
  );
}

export default App;
