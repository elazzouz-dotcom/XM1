body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f4f4f9;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
}
header {
    background-color: #333;
    color: #fff;
    width: 100%;
    padding: 1rem 0;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}
.chat-container {
    width: 90%;
    max-width: 600px;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    margin-top: 20px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    height: 500px;
}
.chat-box {
    flex: 1;
    padding: 20px;
    overflow-y: auto;
    border-bottom: 1px solid #eee;
    display: flex;
    flex-direction: column;
    gap: 15px;
    background-color: #fafafa;
}
.message {
    padding: 12px 16px;
    border-radius: 18px;
    max-width: 80%;
    line-height: 1.5;
    font-size: 15px;
}
.bot-message {
    align-self: flex-start;
    background-color: #e9e9eb;
    color: #333;
    border-bottom-left-radius: 2px;
}
.user-message {
    align-self: flex-end;
    background-color: #007bff;
    color: #fff;
    border-bottom-right-radius: 2px;
}
.input-area {
    padding: 15px;
    display: flex;
    gap: 10px;
    background-color: #fff;
}
input[type="text"] {
    flex: 1;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 25px;
    outline: none;
    font-size: 16px;
}
button {
    background-color: #007bff;
    color: #fff;
    border: none;
    padding: 0 20px;
    border-radius: 25px;
    cursor: pointer;
    font-weight: bold;
}
