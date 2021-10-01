export function getConfig(p = {}) {

    const {config = {}} = p;

    const commonConfig = config.common || {};
    const globalsConfig = config.globals || {};

    const common = {
        ...commonConfig,
        siteName: "Hatchet on the table",
        description: "A conceptual, new-media-art website for the 'Hatchet on the table' still life",
    };

    return {
        config: {
            ...config,
            common: common
        },
    }
}
