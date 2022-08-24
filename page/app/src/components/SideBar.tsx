import React from 'react';
import { Divider } from 'react-daisyui';
import { sidebar } from '../data';

const { description, items, title, version } = sidebar;

export const SideBar = () => {
  return (
    <aside className="sidebar menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content bg-base-200">
      <h2 className='font-title text-primary inline-flex text-lg transition-all duration-200 md:text-3xl'>{title}</h2>
      <Divider />
      <p>{description}</p>
      <Divider />
      <ul className="ul">
        {items.map(({ name, link }, i) => <li key={i}><a href={link}>{name}</a></li>)}
      </ul>
      <Divider />
      <p className='px-4'>{version}</p>
    </aside>
  );
}
