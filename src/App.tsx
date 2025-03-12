
import './App.css'
import PixiCanvas from "./compoments/pixiapp.tsx";

function App() {

  return (
  <>
      <div style={{textAlign: "center", paddingTop: "20px"}}>
          <h2>Pixi.js in React</h2>
          <PixiCanvas/>
      </div>
  </>
  )
}

export default App
