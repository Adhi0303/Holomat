# 🍓 HoloMat: Raspberry Pi Setup Guide (Stage 0)

This guide takes you step-by-step through setting up your Raspberry Pi from scratch. By the end of this, your Pi will be connected to your Wi-Fi, and you will be able to control it remotely from your Windows laptop!

---

## 🛠️ Step 1: What You Need
Gather these items before starting:
1. Your **Raspberry Pi** (3B+ or newer recommended).
2. A **MicroSD Card** (16GB or larger) + an SD Card Reader plugged into your Windows laptop.
3. Your new **HDMI to HDMI cable** + a Monitor or TV.
4. The **Power Supply** for your Raspberry Pi.

---

## 💻 Step 2: Flashing the OS (Done on your Windows Laptop)
We need to install the operating system onto the MicroSD card.

1. **Download the Imager:** Go to [raspberrypi.com/software](https://www.raspberrypi.com/software/) and download/install the **Raspberry Pi Imager** for Windows.
2. **Open the Imager:** Insert your MicroSD card into your laptop and open the Imager app.
3. **Choose Device:** Select your Raspberry Pi model (e.g., Raspberry Pi 3).
4. **Choose OS:** 
   * Go to **Raspberry Pi OS (Other)** -> Select **Raspberry Pi OS Lite (64-bit)**. 
   * *(Note: We use the "Lite" version because your HoloMat backend runs in the background. It saves massive amounts of RAM and CPU since it doesn't load a desktop interface. All control will happen via your laptop anyway!)*
5. **Choose Storage:** Select your MicroSD card.
6. **⚠️ THE MOST IMPORTANT STEP (OS Customization):**
   * Do **NOT** click "Write" yet. Click "Next", then it will ask if you want to apply OS customization settings. Select **"Edit Settings"**.
   * Under the **General** Tab:
     * Set hostname: `holomat`
     * Set username and password: (e.g., User: `pi`, Pass: `raspberry` — *Remember these!*)
     * Configure wireless LAN: Check the box, enter your home Wi-Fi name (SSID) and Password exactly. Set the Wireless LAN country to your country code (e.g., `IN` or `US`).
   * Under the **Services** Tab:
     * Check **"Enable SSH"** and select **"Use password authentication"**.
   * Click **Save**.
7. **Write the OS:** Click **Yes/Write** and wait for it to finish and verify.

---

## 📺 Step 3: The First Boot (The Hardware Part)
Time to bring it to life!

1. Safely remove the MicroSD card from your laptop and insert it into the slot on the underside of the Raspberry Pi.
2. Plug one end of your **HDMI cable** into the Pi, and the other end into your Monitor/TV. 
   * *(Make sure the monitor is turned ON and on the correct HDMI input).*
3. Finally, **plug in the Power Supply** to the Raspberry Pi.
4. **Watch the Screen:** You will see a bunch of text scrolling down the monitor. This is normal! It means the Pi is booting up and connecting to your Wi-Fi. 
5. When it stops scrolling, it will ask for a "holomat login:". You don't actually need to plug a keyboard into the Pi, because we enabled SSH!

---

## 📡 Step 4: Connecting from your Windows Laptop
Now we connect to the Pi via "SSH" (Secure Shell). This gives you a terminal window on your laptop that secretly controls the Pi over the air.

1. Open **PowerShell** on your Windows laptop.
2. Type the following command and hit Enter:
   ```bash
   ssh pi@holomat.local
   ```
   *(Note: Replace `pi` with whatever username you chose in Step 2).*
3. If it asks "Are you sure you want to continue connecting?", type `yes` and hit Enter.
4. It will ask for your password. **Type the password you set in Step 2.** (Note: The screen won't show asterisks `***` while you type, it will stay completely blank. Just type it and hit Enter).
5. If the terminal prompt changes to `pi@holomat:~ $`, **CONGRATULATIONS!** 🎉 You are inside the Raspberry Pi!

---

## 🚀 Next Steps
Once you successfully see the `pi@holomat:~ $` prompt on your Windows machine, let me know! The next phase will be using that connection to install Python and download our backend code onto the Pi.
