import { Drawer as DaisyDrawer } from "react-daisyui";
import { SideBar } from "./SideBar";

export const Drawer = ({ children, isOpen, toggleDrawer }: any) => {
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
