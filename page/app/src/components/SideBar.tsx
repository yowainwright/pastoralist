import React from "react";
import { Divider } from "react-daisyui";
import { sidebar } from "../data";

const { description, items, logo, subtitle, title, version } = sidebar;

export const SideBar = () => {
  return (
    <aside className="sidebar menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content bg-base-200">
      <figure className="flex justify-center max-w-xs mb-5">
        <img className="w-20" src={logo} />
      </figure>
      <h2 className="font-title font-black text-primary inline-flex text-lg transition-all duration-200 md:text-3xl mb-5">
        {title}
      </h2>
      <h3 className="font-title text-base-content inline-flex text-sm transition-all duration-200 md:text-3m">
        {subtitle}
      </h3>
      <Divider />
      <p className="font-bold">{description}</p>
      <Divider />
      <ul className="ul">
        {items.map(({ name, link }, i) => (
          <li key={i}>
            <a href={link}>{name}</a>
          </li>
        ))}
      </ul>
      <Divider />
      <p className="px-4">{version}</p>
    </aside>
  );
};
