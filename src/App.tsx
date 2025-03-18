import './App.css'
// import React from 'react';
import DAWContainer from './components/daw/DAWContainer';
// import PixiCanvas from "./components/pixi/PixiCanvas";

function App() {
    console.log("App rendering");  // 檢查點 1
    return (
        <div className="App">
            <DAWContainer />
        </div>
    );
}

export default App
