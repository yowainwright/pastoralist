import React, { useState } from 'react';
import { Button, Drawer as DaisyDrawer } from 'react-daisyui';
import { SideBar } from './SideBar';

export const Drawer = ({ children }: any) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer= () => setIsOpen(!isOpen);

  return (
    <DaisyDrawer side={<SideBar />} open={isOpen} onClickOverlay={toggleDrawer} mobile>
      <div className="flex h-56 items-center justify-center">
        <Button color="primary" className="lg:hidden" onClick={toggleDrawer}>
          Open drawer
        </Button>
        {children}
      </div>
    </DaisyDrawer>
  );
}
