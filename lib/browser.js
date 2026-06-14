import common from "bloggify/actions/common.js"
import WsAction from "./common/ws-action.js"
import SocketIO from "socket.io-client"

export default (name, handler) => {
    const socket = SocketIO.connect(common.wsUrl(name))
    const action = new WsAction(name, socket)
    if (handler) {
        const send = (err, data) => {
            socket.emit("__data", err, data)
        }
        socket.on("error", err => {
            handler(err, null, socket, send)
        })
        socket.on("__data", (err, data) => {
            handler(err, data, socket, send)
        })
    }
    return action
}
