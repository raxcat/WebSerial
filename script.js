let port;
let writer;
let reader;
let keepReading = false;
document.getElementById("connect").addEventListener("click", async () => {
    try {
        // 請求用戶選擇裝置
        port = await navigator.serial.requestPort();
        try {
            await port.open({ baudRate: 9600 }); // 設定波特率
        } catch (error) {
            console.log(error)
        }
        

        // 初始化 Writer
        const encoder = new TextEncoderStream();
        encoder.readable.pipeTo(port.writable);
        writer = encoder.writable.getWriter();

        // 初始化 Reader
        const decoder = new TextDecoderStream();
        port.readable.pipeTo(decoder.writable);
        reader = decoder.readable.getReader();

        keepReading = true;
        readSerialData();

        document.getElementById("output").value += "Connected to device.\n";
        toggleButtons(true);
    } catch (err) {
        console.error("Error connecting to device:", err);
    }
});

document.getElementById("disconnect").addEventListener("click", async () => {
    try {
        keepReading = false; // 停止讀取
        if (reader) await reader.cancel(); // 結束讀取器
        if (writer) await writer.close(); // 關閉寫入器
        if (port) await port.close(); // 關閉埠

        document.getElementById("output").value += "Disconnected from device.\n";
        toggleButtons(false);
    } catch (err) {
        console.error("Error disconnecting:", err);
    }
});

document.getElementById("send").addEventListener("click", async () => {
    const data = document.getElementById("input").value;
    if (writer && data) {
        await writer.write(data + "\n"); // 發送資料
        document.getElementById("output").value += `Sent: ${data}\n`;
    } else {
        document.getElementById("output").value += "No data to send or device not connected.\n";
    }
});

// 持續讀取資料
async function readSerialData() {
    try {
        while (keepReading) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }
            document.getElementById("output").value += `Received: ${value}\n`;
        }
    } catch (err) {
        console.error("Error reading data:", err);
    } finally {
        reader.releaseLock();
    }
}

// 按鈕狀態切換
function toggleButtons(isConnected) {
    document.getElementById("connect").disabled = isConnected;
    document.getElementById("disconnect").disabled = !isConnected;
    document.getElementById("send").disabled = !isConnected;
}
