import React from 'react'
import { Drawer } from './components/Drawer'
import { Docs } from './components/Docs'
import Badges from './content/badges.mdx';
import Introduction from './content/introduction.mdx';

export function App() {
  return (
    <main className="App main">
      <Drawer>
        <Docs Component={Badges} />
        <Docs Component={Introduction} />
      </Drawer>
    </main>
  )
}

export default App
