import Button from 'remote_app/Button';
import useStore from 'remote_app/store';
import './App.css';

function App() {
  const [count, setCount] = useStore(0);

  return (
    <div className='App'>
      <h1>Host Application</h1>
      <Button />
      <div className='card'>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
      </div>
    </div>
  );
}

export default App;
