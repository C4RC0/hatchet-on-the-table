import App from "./components/App";
import routes from "./config/constants/routes";

export default function setContents(p = {}) {

    const {wapp} = p;

    function getTitle({wapp, req, res, title}) {
        const config = wapp.getTargetObject().config;
        const {siteName = "Wapplr"} = config;
        const {statusCode, statusMessage, errorMessage} = res.wappResponse;
        if (statusCode === 404) {
            title = statusMessage || "Not found";
        }
        if (statusCode === 500) {
            title = errorMessage || statusMessage || "Internal Server Error";
        }
        return title + " | " + siteName;
    }

    wapp.contents.add({
        canvas: {
            render: App,
            description: "Hatchet on the table",
            renderType: "react",
            title: function (p) {
                return getTitle({...p, title: "Canvas"})
            }
        },
        concept: {
            render: App,
            description: "Concept",
            renderType: "react",
            title: function (p) {
                return getTitle({...p, title: "Concept"})
            }
        },
    });

    wapp.router.replace([
        {path: "/", contentName: "canvas"},
        {path: routes.canvasRoute, contentName: "canvas"},
        {path: routes.conceptRoute, contentName: "concept"},
    ])

}
