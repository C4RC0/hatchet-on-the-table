import React, {useContext} from "react";
import {WappContext} from "wapplr-react/dist/common/Wapp";
import clsx from "clsx";

import style from "./style.css";
import photo from "./photo.jpg";
import howWasItMade from "./how-was-it-made.jpg";
import preview1 from "./preview-1920x1080.jpg";

export default function Concept() {

    const context = useContext(WappContext);
    const {wapp} = context;
    wapp.styles.use(style);

    return (
        <div className={style.concept}>
            <div className={style.section}>
                <div className={style.title}>
                    <span className={style.hatchet}>{"Hatchet "}</span>
                    <span className={style.on}>{"on "}</span>
                    <span className={style.table}>{"the table"}</span>
                </div>
                <div className={style.subtitle}>
                    {"A new-media-art website for the 'Hatchet on the table' 3D still life"}
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"Concept"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"Objects belong to people. There can be a countless reasons why an object is placed on the table. In this case, this object is a work tool. Why is the hatchet on the table? Maybe someone just got home from work and put it on the kitchen table, but it’s also conceivable that the work was done and also that they won’t be using it anymore. What kind of story would you think of about it?"}</div>
                        <div>{"This artwork is also part of a series in which I rework my previously painted oil paintings with modern technology."}</div>
                    </div>
                </div>
                <div className={style.sectionTitle}>{"The original"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"In 2014, I painted this still life on a 40x50 canvas with oil. The composition shows a hatchet and a lamp on the kitchen table. The hatchet belongs to my carpenter father. I made it for him as a gift for his 60th birthday." }</div>
                    </div>
                    <div className={clsx(style.column, style.grayBgForPhoto)}>
                        <img className={style.photo} src={photo}/>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"How was it made?"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div>{"I made this version in 3D with awesome Three Js library. In this interactive form, it is also valid as an independent artwork within the new-media-art genre."}</div>
                        <div className={clsx(style.column, style.grayBgForPhoto)}>
                            <img className={style.howWasItMade} src={howWasItMade}/>
                        </div>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"About me"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div><span>{"You can read more about me on my "}</span><span><a href={"https://github.com/C4RC0"} target={"_blank"}>{"Github"}</a></span></div>
                    </div>
                </div>
            </div>
            <div className={style.section}>
                <div className={style.sectionTitle}>{"Preview"}</div>
                <div className={style.sectionContent}>
                    <div className={style.column}>
                        <div className={clsx(style.column, style.grayBgForPhoto)}>
                            <img className={style.previews} src={preview1}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
