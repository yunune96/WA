"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RootLayout;
const react_1 = __importDefault(require("react"));
function RootLayout({ children, }) {
    return (<html lang="en">
      <body>{children}</body>
    </html>);
}
//# sourceMappingURL=layout.js.map