import React from "react";
import { Divider } from "react-daisyui";
import { GiAnatomy } from "react-icons/gi";
import { IoIosRocket } from "react-icons/io";
import { FaToolbox, FaRegLightbulb } from "react-icons/fa";
import { SiAwesomelists } from "react-icons/si";

export const SideBar = () => {
  return (
    <aside className="sidebar menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content bg-base-200">
      <figure className="flex justify-center max-w-xs mb-5">
        <img
          className="w-20"
          src="https://user-images.githubusercontent.com/1074042/193210573-71704355-64ce-4d88-8394-2c07e6e66c2c.svg"
        />
      </figure>
      <h2 className="font-title font-black text-primary inline-flex text-lg transition-all duration-200 md:text-3xl mb-5">
        Pastoralist
      </h2>
      <h3 className="font-title text-base-content inline-flex text-sm transition-all duration-200 md:text-3m pl-4">
        Pastoralist is a CLI tool for managing package.json overrides (or
        resolutions) with ease
      </h3>
      <Divider />
      <p className="font-bold">
        Manage your package.json overrides or resolutions with ease!
      </p>
      <Divider />
      <ul className="ul">
        <li>
          <a href="#what-are-overrides-and-resolutions">
            <FaRegLightbulb /> What are overrides/resolutions?
          </a>
        </li>
        <li>
          <a href="#why-is-patoralist-awesome">
            <SiAwesomelists /> Why is Pastoralist Awesome?
          </a>
        </li>
        <li>
          <a href="#how-pastoralist-works">
            <FaToolbox /> How Pastoralist works
          </a>
        </li>
        <li>
          <a href="#setup">
            <IoIosRocket /> Simple to set up!
          </a>
        </li>
        <li>
          <a href="#pastoralist-object-anatomy">
            <GiAnatomy /> Pastoralist Object Anatomy
          </a>
        </li>
      </ul>
    </aside>
  );
};
