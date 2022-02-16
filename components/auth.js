const router = require('express').Router();
const fs = require('fs');
const User = require('./user.model');

router.get('/checkauth', async (req, res) => {
    client.getState().then((data) => {
        console.log(data)
        res.send(data)
    }).catch((err) => {
        if (err) {
            res.send("DISCONNECTED")
            try {
                fs.unlinkSync('../session.json')
            } catch(err) {
                console.log(err)
            }
        }
    })
});

router.get('/getqr', async (req,res) => {
    client.getState().then((data) => {
        res.write("<html><body><h2>Already Authenticated</h2></body></html>");
        res.end();
    }).catch((err) => {
        fs.readFile('components/last.qr', (err,last_qr) => {
            if (!err && last_qr) {
                var page = `
                    <html>
                        <body>
                            <script type="module">
                            </script>
                            <div id="qrcode"></div>
                            <script type="module">
                                import QrCreator from "https://cdn.jsdelivr.net/npm/qr-creator/dist/qr-creator.es6.min.js";
                                let container = document.getElementById("qrcode");
                                QrCreator.render({
                                    text: "${last_qr}",
                                    radius: 0.5, // 0.0 to 0.5
                                    ecLevel: "H", // L, M, Q, H
                                    fill: "#536DFE", // foreground color
                                    background: null, // color or null for transparent
                                    size: 256, // in pixels
                                }, container);
                            </script>
                        </body>
                    </html>
                `
                res.write(page)
                res.end();
            }
        });
    })
});

router.post('/register', async (req,res) =>{
    try {
        const { phoneNum } = req.body;
        const user = await User.findOne({ phoneNum });
        if (user) return res.status(401).json({message: 'Your number is already registered with us for waiting list.'});
        let phone = phoneNum;
        let message = "You have been successfully registered to Equiseed's waiting list.";
        if (phone == undefined || message == undefined) {
            res.send({ status:"error", message:"please enter valid phone and message" })
        } else {
            client.sendMessage(phone + '@c.us', message).then(async (response) => {
                if (response.id.fromMe) {
                    console.log(response.id)
                    const newUser = new User({ ...req.body, role: "Message Sent" });
                    await newUser.save();
                    res.status(200).json({ status:'success', message: `Message successfully sent to ${phone}` })
                }
            });
        }
    } catch (error) {
        res.status(500).json({success: false, message: error.message})
    }
})

module.exports = router;