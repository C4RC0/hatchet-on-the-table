export function getConfig(p = {}) {

    const {config = {}} = p;

    const commonConfig = config.common || {};
    const globalsConfig = config.globals || {};

    const common = {
        ...commonConfig,
        siteName: "Hatchet on the table",
        description: "A new-media-art website for the 'Hatchet on the table' 3D still life",
    };

    return {
        config: {
            ...config,
            common: common
        },
    }
}
