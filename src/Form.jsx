import { useState } from 'react';
import './App.css';


export default function Form() {
    const [formData, setFormData] = useState({
        email: '',
        campusId: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormData({
            email: '',
            campusId: '',
        });
    };
    
    
    return (
        <div>
           <div className="form-container">
           
           <div className='form-header'>
           <img src = './Image/tiger.png' alt = 'tiger' className='form-image'/>

            <div className="form-body">
            <form onSubmit={handleSubmit}>

                <input type="email" className='form-input' name="email" value={formData.email} onChange={handleChange} placeholder='Enter your email'/>
                <br /> 
                <input type="text" className='form-input' name="campusId" value={formData.campusId} onChange={handleChange} placeholder='Enter your campus ID'/>
                <br />
                <button className='form-button' type="submit">Submit</button>
                </form>
                </div>

            </div>
           </div>
        </div>
    )
}



