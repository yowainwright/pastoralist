import React, { useState } from 'react';
import { Button, Drawer as DaisyDrawer } from 'react-daisyui';
import { SideBar } from './SideBar';

export const Drawer = ({ children }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer= () => {
    console.log({ isOpen });
    setIsOpen(!isOpen);
  }

  return (
    <DaisyDrawer side={<SideBar />} open={isOpen} onClickOverlay={toggleDrawer} mobile>
      <div className="h-56 px-6">
        {children}
      </div>
    </DaisyDrawer>
  );
}
