import { type NextRequest, NextResponse } from "next/server"

// 🎯 BASE DE DATOS DE MARCAS Y MODELOS EXPANDIDA
const brandDatabase = {
    // 👟 ZAPATILLAS
    nike: {
        models: ["air max", "air force", "dunk", "jordan", "blazer", "cortez", "react", "zoom"],
        description:
            "Nike es la marca líder mundial en calzado deportivo, conocida por su innovación, comodidad y estilo icónico.",
        features: ["Tecnología Air", "Suela antideslizante", "Materiales premium", "Diseño ergonómico"],
    },
    adidas: {
        models: ["stan smith", "superstar", "gazelle", "ultraboost", "nmd", "yeezy"],
        description: "Adidas combina rendimiento deportivo con estilo urbano, ofreciendo calzado de alta calidad.",
        features: ["Tecnología Boost", "Suela de goma", "Diseño clásico", "Comodidad superior"],
    },
    puma: {
        models: ["suede", "basket", "cali", "rs-x", "future"],
        description: "Puma ofrece calzado deportivo con diseño moderno y tecnología avanzada.",
        features: ["Suela deportiva", "Materiales duraderos", "Estilo contemporáneo"],
    },

    // 🌸 PERFUMERÍA
    chanel: {
        models: ["no. 5", "coco", "chance", "bleu", "gabrielle"],
        description: "Chanel es sinónimo de elegancia y sofisticación en el mundo de la perfumería de lujo.",
        features: ["Fragancia de larga duración", "Notas exclusivas", "Presentación elegante", "Calidad premium"],
    },
    dior: {
        models: ["sauvage", "jadore", "miss dior", "poison"],
        description: "Dior representa la excelencia francesa en perfumería con fragancias icónicas.",
        features: ["Esencias naturales", "Fragancia intensa", "Diseño exclusivo"],
    },

    // 💎 JOYAS
    pandora: {
        models: ["charm", "anillo", "pulsera", "collar"],
        description: "Pandora ofrece joyería personalizable de alta calidad con diseños únicos.",
        features: ["Plata de ley", "Diseño personalizable", "Acabado premium"],
    },

    // 🧑‍🍳 COCINA
    tefal: {
        models: ["ingenio", "expertise", "ceramic"],
        description: "Tefal es líder en utensilios de cocina con tecnología antiadherente.",
        features: ["Recubrimiento antiadherente", "Distribución uniforme del calor", "Fácil limpieza"],
    },
}

// 🎯 PLANTILLAS DE DESCRIPCIÓN POR CATEGORÍA
const categoryTemplates = {
    Zapatillas: {
        intro: "Descubre el estilo y la comodidad con estas zapatillas",
        features: [
            "Diseño moderno y versátil",
            "Comodidad para uso diario",
            "Materiales de calidad",
            "Perfectas para cualquier ocasión",
        ],
        closing: "Ideales para complementar tu look casual o deportivo.",
    },
    Perfumería: {
        intro: "Envuélvete en una fragancia única y cautivadora",
        features: [
            "Fragancia de larga duración",
            "Notas aromáticas equilibradas",
            "Presentación elegante",
            "Perfecto para cualquier momento",
        ],
        closing: "Una fragancia que define tu personalidad y estilo.",
    },
    Joyas: {
        intro: "Realza tu belleza con esta pieza de joyería excepcional",
        features: [
            "Materiales de alta calidad",
            "Diseño elegante y sofisticado",
            "Acabado impecable",
            "Perfecto para ocasiones especiales",
        ],
        closing: "Una joya que complementa tu estilo único.",
    },
    Ropa: {
        intro: "Viste con estilo y comodidad",
        features: [
            "Materiales de calidad premium",
            "Diseño moderno y versátil",
            "Corte perfecto",
            "Ideal para múltiples ocasiones",
        ],
        closing: "Una prenda esencial para tu guardarropa.",
    },
    Blanquería: {
        intro: "Transforma tu hogar en un espacio de confort y elegancia",
        features: ["Materiales suaves y duraderos", "Diseño moderno", "Fácil cuidado", "Calidad superior"],
        closing: "Perfecto para crear un ambiente acogedor en tu hogar.",
    },
    "Carteras y Bolsos": {
        intro: "Combina funcionalidad y estilo en cada ocasión",
        features: [
            "Materiales resistentes",
            "Diseño práctico y elegante",
            "Múltiples compartimentos",
            "Versatilidad de uso",
        ],
        closing: "El complemento perfecto para tu look diario.",
    },
    Electrodomésticos: {
        intro: "Facilita tu vida diaria con tecnología de vanguardia",
        features: ["Tecnología avanzada", "Fácil uso", "Diseño moderno", "Eficiencia energética"],
        closing: "La solución perfecta para tu hogar moderno.",
    },
    "Ollas y Accesorios de Cocina": {
        intro: "Cocina como un profesional con estos utensilios de calidad",
        features: [
            "Materiales de grado alimentario",
            "Distribución uniforme del calor",
            "Fácil limpieza",
            "Durabilidad garantizada",
        ],
        closing: "Esenciales para cualquier cocina moderna.",
    },
    "Juguetes y Peluches": {
        intro: "Diversión y alegría garantizada",
        features: ["Materiales seguros", "Diseño atractivo", "Estimula la creatividad", "Horas de entretenimiento"],
        closing: "Perfecto para crear momentos especiales y memorables.",
    },
}

// 🔍 FUNCIÓN PARA DETECTAR MARCA Y MODELO
function detectBrandAndModel(productName: string) {
    const nameLower = productName.toLowerCase()

    for (const [brand, data] of Object.entries(brandDatabase)) {
        if (nameLower.includes(brand)) {
            const detectedModel = data.models.find((model) => nameLower.includes(model))
            return { brand, model: detectedModel, data }
        }
    }

    return null
}

// 🎯 FUNCIÓN PRINCIPAL DE GENERACIÓN
function generateProductDescription(name: string, category: string, subcategory: string) {
    const brandInfo = detectBrandAndModel(name)
    const template = categoryTemplates[category as keyof typeof categoryTemplates] || categoryTemplates["Ropa"]

    let description = ""

    if (brandInfo) {
        // 🔥 DESCRIPCIÓN CON MARCA DETECTADA
        const { brand, model, data } = brandInfo

        description += `${template.intro} ${name}. `
        description += `${data.description} `

        if (model) {
            description += `El modelo ${model} es reconocido por su calidad excepcional y diseño distintivo. `
        }

        description += "\n\n✨ **Características destacadas:**\n"
        data.features.forEach((feature) => {
            description += `• ${feature}\n`
        })

        description += `\n${template.closing}`
    } else {
        // 🔥 DESCRIPCIÓN GENÉRICA PERO PROFESIONAL
        description += `${template.intro} ${name}. `
        description += `Este producto de la categoría ${category} - ${subcategory} ha sido seleccionado por su calidad excepcional y diseño atractivo. `

        description += "\n\n✨ **Características destacadas:**\n"
        template.features.forEach((feature) => {
            description += `• ${feature}\n`
        })

        description += `\n${template.closing}`
    }

    // 🔥 AGREGAR INFORMACIÓN ADICIONAL
    description += "\n\n📦 **Información adicional:**\n"
    description += "• Producto importado de alta calidad\n"
    description += "• Envío rápido y seguro\n"
    description += "• Garantía de satisfacción\n"
    description += "• Atención personalizada\n"

    description += "\n💬 **¡Consultanos por WhatsApp para más información!**"

    return description
}

export async function POST(request: NextRequest) {
    try {
        let body
        try {
            body = await request.json()
        } catch (parseError) {
            console.error("Error parsing request body:", parseError)
            return NextResponse.json({ error: "Error al procesar los datos enviados" }, { status: 400 })
        }

        const { name, category, subcategory } = body

        // Validaciones
        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "El nombre del producto es requerido" }, { status: 400 })
        }

        if (!category || typeof category !== "string") {
            return NextResponse.json({ error: "La categoría es requerida" }, { status: 400 })
        }

        // Generar descripción
        const description = generateProductDescription(name.trim(), category.trim(), subcategory?.trim() || "")

        if (!description || description.trim().length === 0) {
            return NextResponse.json({ error: "No se pudo generar la descripción" }, { status: 500 })
        }

        return NextResponse.json({
            description,
            detectedBrand: detectBrandAndModel(name)?.brand || null,
            category,
            subcategory,
        })
    } catch (error: any) {
        console.error("Error generating description:", error)
        const errorMessage = error?.message || "Error interno del servidor"
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
