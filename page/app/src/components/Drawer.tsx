import React, { useState } from 'react';
import { Button, Drawer as DaisyDrawer } from 'react-daisyui';


const SideItems = (
  <ul className="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content">
    <li>
      <a>Sidebar Item 1</a>
    </li>
    <li>
      <a>Sidebar Item 2</a>
    </li>
  </ul>
)

export const Drawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer= () => {
    console.log({ isOpen});
    setIsOpen(!isOpen);
  }

  return (
    <DaisyDrawer side={SideItems} >
      <div className="flex h-56 items-center justify-center">
        <Button color="primary" className="lg:hidden" onClick={toggleDrawer}>
          Open drawer
        </Button>
      </div>
    </DaisyDrawer>
  );
}
