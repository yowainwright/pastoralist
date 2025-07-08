import React from "react";
import { Drawer as DaisyDrawer } from "react-daisyui";
import { SideBar } from "./SideBar";

export type DrawerProps = {
  children: React.ReactNode;
  isOpen: boolean;
  toggleDrawer: () => void;
};

export const Drawer = ({ children, isOpen, toggleDrawer }: DrawerProps) => {
  return (
    <DaisyDrawer
      className="lg:drawer-open"
      side={<SideBar />}
      open={isOpen}
      onClickOverlay={toggleDrawer}
    >
      <div className="h-full">{children}</div>
    </DaisyDrawer>
  );
};
