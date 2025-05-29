const scriptURL = 'https://script.google.com/macros/s/AKfycbxTG6PhBkuHSXUEPHdYbcScIw8PFiASItNo182lSFGasRn5qkIEdYhCMMTStLejF8CM/exec';

const form = document.forms['contact-form'];

form.addEventListener('submit', e => {
    e.preventDefault(); // Mencegah form reload default

    fetch(scriptURL, {
        method: 'POST',
        body: new FormData(form), 
    })
    .then(response => response.text()) 
    .then(data => {
        alert("Thank you! Your form has been submitted successfully.");
        form.reset(); 
    })
    .catch(error => {
        console.error('Error!', error.message);
        alert("There was an error submitting the form.");
    });
});