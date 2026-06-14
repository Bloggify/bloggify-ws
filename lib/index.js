import { Server } from 'socket.io';
import deffy from "deffy";
import WsAction from "./common/ws-action.js"
import { wsUrl } from "bloggify/lib/client/common/index.js"

export default () => {
    const Actions = Bloggify.actions

    if (!Actions) {
        Bloggify.log("No actions found. Websockets will not be enabled.", "warn")
        return
    }

    Actions.ws = (name, middlewares, handler) => {
        if (typeof middlewares === "function") {
            handler = middlewares
            middlewares = []
        }
        middlewares = deffy(middlewares, [])
        let thisWsAction = Actions.ws._[name]
        if (thisWsAction && (middlewares.length || handler)) {
            throw new Error("There is already a WS action with this name.")
        }

        const url = wsUrl(name)
        const ws = Actions.ws.server.of(url)

        middlewares.forEach(c => { ws.use(c); })

        if (handler) {
            ws.on("connect", socket => {
                socket.on("__data", (err, data) => {
                    handler(err, data, socket, (err, data) => {
                        socket.emit("__data", err, data)
                    })
                })
            })
        }

        thisWsAction = Actions.ws._[name] = new WsAction(name, ws)
        setInterval(() => { thisWsAction.heartbeat() }, 50 * 1000)

        return thisWsAction
    }

    Actions.ws._ = {}
    Bloggify.wsServer = Actions.ws.server = new Server(Bloggify.server.server)
};
