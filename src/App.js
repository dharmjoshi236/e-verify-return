import {Routes,Route} from 'react-router-dom'
import AcknowledgementForm from './components/Acknowledgement_form';


import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
   <Routes>
    <Route exact path='/' element={<AcknowledgementForm/>} />
   </Routes>
  );
}

export default App;
