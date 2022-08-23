import React, { useState } from 'react';

export const SideBar = () => {
  return (
    <section>
    <div>
      <h1>Pastoralist</h1>
    </div>
     <ul className="menu p-4 overflow-y-auto w-80 bg-base-100 text-base-content bg-base-200">
    <li>
      <a>Sidebar Item 1a</a>
    </li>
    <li>
      <a>Sidebar Item 2</a>
    </li>
  </ul>
  </section>
  )
}
