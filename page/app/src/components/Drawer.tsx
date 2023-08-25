import React from "react";
import { Drawer as DaisyDrawer } from "react-daisyui";
import { SideBar } from "./SideBar";

export type DrawerProps = {
  children: React.ReactNode;
  isOpen: boolean;
  toggleDrawer: () => void;
}

export const Drawer = ({ children, isOpen, toggleDrawer }: DrawerProps) => {
  return (
    <DaisyDrawer
      side={<SideBar />}
      open={isOpen}
      onClickOverlay={toggleDrawer}
      mobile
    >
      <div className="h-100 px-6">{children}</div>
    </DaisyDrawer>
  );
};
