"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const db_1 = __importDefault(require("../src/config/db"));
const User_1 = require("../src/models/User");
function parseArgs() {
    const args = process.argv.slice(2);
    const out = {};
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a.startsWith('--')) {
            const key = a.slice(2);
            const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : undefined;
            out[key] = val === undefined ? true : val;
            if (val)
                i++;
        }
    }
    return out;
}
(async () => {
    try {
        const argv = parseArgs();
        const email = argv.email || process.env.ADMIN_EMAIL;
        if (!email) {
            console.error('Usage: npx ts-node --transpile-only scripts/promoteAdmin.ts --email you@domain');
            process.exit(1);
        }
        await (0, db_1.default)();
        const user = await User_1.User.findOne({ email });
        if (!user) {
            console.error('No user found with that email:', email);
            process.exit(1);
        }
        if (user.role === 'admin') {
            console.log('User is already admin:', email);
            process.exit(0);
        }
        user.role = 'admin';
        await user.save();
        console.log('User promoted to admin:', { email: user.email, id: user._id?.toString ? user._id.toString() : user._id });
        process.exit(0);
    }
    catch (err) {
        console.error('Error promoting admin:', err?.message || err);
        process.exit(1);
    }
})();
