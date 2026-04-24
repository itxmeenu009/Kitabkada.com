// ==================== EMAILJS INITIALIZATION ====================
(function() {
    emailjs.init("GWeOGM-cWhf8QuEY2");
})();

// ==================== FEEDBACK FORM HANDLER ====================
document.addEventListener('DOMContentLoaded', function() {
    
    const nameInput = document.getElementById('feedback-name');
    const emailInput = document.getElementById('feedback-email');
    const messageInput = document.getElementById('feedback-text');
    const sendBtn = document.getElementById('feedback-send');
    const statusDiv = document.getElementById('feedback-status');
    const form = document.getElementById('feedback-form');
    
    if (!sendBtn) return;
    
    // ==================== SEND FEEDBACK ====================
    sendBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        // Reset status
        statusDiv.className = '';
        statusDiv.style.display = 'none';
        
        // Validation
        if (!name) return showStatus('Please enter your full name.', 'error');
        if (!email) return showStatus('Please enter your email address.', 'error');
        if (!isValidEmail(email)) return showStatus('Please enter a valid email address.', 'error');
        if (!message) return showStatus('Please write your message.', 'error');
        if (message.length < 10) return showStatus('Message must be at least 10 characters.', 'error');
        
        // Disable button
        const originalHTML = sendBtn.innerHTML;
        sendBtn.disabled = true;
        sendBtn.innerHTML = '<i class="bx bx-loader bx-spin"></i> Sending...';
        
        try {
            await emailjs.send('service_9j23n9f', 'template_r5lqg5y', {
                name: name,
                email: email,
                message: message,
                title: 'New Feedback from Kitab Kada',
                time: new Date().toLocaleString('en-PK', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            });
            
            console.log('✅ Feedback sent!');
            showStatus('Thank you! Your feedback has been sent successfully.', 'success');
            form.reset();
            
            const counter = document.querySelector('.char-counter');
            if (counter) counter.remove();
            
        } catch (error) {
            console.error('EmailJS Error:', error);
            showStatus('Failed to send. Please try again later.', 'error');
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = originalHTML;
        }
    });
    
    // ==================== HELPERS ====================
    function showStatus(message, type) {
        statusDiv.textContent = (type === 'error' ? '⚠️ ' : '✅ ') + message;
        statusDiv.className = type;
        statusDiv.style.display = 'block';
        
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, type === 'success' ? 5000 : 8000);
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Character counter
    messageInput.addEventListener('input', function() {
        const count = this.value.length;
        const max = 500;
        
        let counter = document.querySelector('.char-counter');
        if (!counter) {
            counter = document.createElement('div');
            counter.className = 'char-counter';
            counter.style.cssText = 'text-align:right;font-size:0.8rem;color:#718096;margin-top:-8px;';
            this.parentNode.insertBefore(counter, this.nextSibling);
        }
        
        counter.textContent = `${count}/${max} characters`;
        counter.style.color = count > max ? '#e53e3e' : '#718096';
        
        if (count > max) this.value = this.value.substring(0, max);
        if (count === 0 && counter) counter.remove();
    });
    
    // Ctrl+Enter to send
    messageInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            sendBtn.click();
        }
    });
});