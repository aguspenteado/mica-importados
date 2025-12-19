"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Upload, X, Save, Eye, Trash2, Package, Star, Loader2, ImageIcon, Tag, DollarSign, FileText, Palette, Ruler, CheckCircle, AlertCircle, Sparkles, EyeOff, TrendingUp, ShoppingCart, Cloud, RefreshCw, Settings, AlertTriangle, Menu, FolderPlus, Pencil } from 'lucide-react'
import Link from "next/link"
import { createProduct, getProducts, deleteProduct, updateProduct, createCategory, createSubcategory, getCategories, getSubcategories, deleteCategory, deleteSubcategory, deleteSubcategoriesByCategory, addSubcategoryToCategory } from "@/lib/firestore-api"
import { uploadImages, validateImages, checkCloudinaryStatus } from "@/lib/upload-helpers"

// Tipos para TypeScript
interface ValidationResult {
    valid: boolean
    validFiles: File[]
    errors: string[]
    invalidCount: number
}
interface UploadResult {
    success: boolean
    uploaded: number
    failed: number
    images: Array<{ url: string; publicId: string }>
    errors: string[]
}
interface CloudinaryStatusResult {
    success: boolean
    message: string
    error?: string
}
interface ProductFormData {
    name: string
    description: string
    price: number
    category: string
    subcategory: string
    badge: string
    sizes: string[]
    images: File[]
    imageUrls: string[]
    inStock: boolean
    stockCount: number
    features: string[]
}

export default function PanelPage() {
    const [activeTab, setActiveTab] = useState<"create" | "manage">("create")
    const [loading, setLoading] = useState(false)
    const [uploadingImages, setUploadingImages] = useState(false)
    const [generatingDescription, setGeneratingDescription] = useState(false)
    const [products, setProducts] = useState<any[]>([])
    const [loadingProducts, setLoadingProducts] = useState(false)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [cloudinaryStatus, setCloudinaryStatus] = useState<"checking" | "connected" | "error">("checking")
    const [cloudinaryError, setCloudinaryError] = useState<string>("")
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Nuevo estado para la edición de imágenes de un producto existente
    const [editingProduct, setEditingProduct] = useState<any | null>(null)
    const [editProductImages, setEditProductImages] = useState<string[]>([])

    // Estados para crear categorías y subcategorías
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryIcon, setNewCategoryIcon] = useState("📦")
    const [newCategoryDescription, setNewCategoryDescription] = useState("")
    const [newSubcategoryName, setNewSubcategoryName] = useState("")
    const [selectedCategoryForSubcategory, setSelectedCategoryForSubcategory] = useState("")
    const [creatingCategory, setCreatingCategory] = useState(false)
    const [creatingSubcategory, setCreatingSubcategory] = useState(false)

    // Estado para crear subcategoría al crear categoría
    const [createSubcategoryWithCategory, setCreateSubcategoryWithCategory] = useState(false)
    const [initialSubcategoryName, setInitialSubcategoryName] = useState("")

    // Estados para categorías y subcategorías desde Firestore
    const [firestoreCategories, setFirestoreCategories] = useState<any[]>([])
    const [firestoreSubcategories, setFirestoreSubcategories] = useState<any[]>([])
    const [loadingCategories, setLoadingCategories] = useState(false)

    // Estados para editar subcategorías
    const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
    const [newSubcategoryNameToAdd, setNewSubcategoryNameToAdd] = useState("")
    const [addingSubcategory, setAddingSubcategory] = useState(false)

    // 🎯 CATEGORÍAS CON TALLES INTELIGENTES
    const categoriesData = {
        Joyas: {
            subcategories: ["Anillos", "Pulseras", "Dijes", "Cadenas", "Aros", "Alianzas"],
            suggestedSizes: [],
            icon: "💎",
        },
        Perfumería: {
            subcategories: ["Perfumes Dama", "Perfumes Hombre", "Cremas", "Maquillaje"],
            suggestedSizes: [],
            icon: "🌸",
        },
        Blanquería: {
            subcategories: ["Acolchados", "Sábanas", "Toallas", "Cortinas"],
            suggestedSizes: ["Individual", "1 Plaza", "2 Plazas", "Queen", "King"],
            icon: "🛏️",
        },
        "Carteras y Bolsos": {
            subcategories: ["Carteras", "Bolsos", "Mochilas", "Billeteras"],
            suggestedSizes: ["Pequeño", "Mediano", "Grande"],
            icon: "👜",
        },
        "Juguetes y Peluches": {
            subcategories: ["Juguetes", "Peluches", "Educativos"],
            suggestedSizes: [],
            icon: "🧸",
        },
        Electrodomésticos: {
            subcategories: ["Cocina", "Limpieza", "Cuidado Personal"],
            suggestedSizes: [],
            icon: "⚡",
        },
        Zapatillas: {
            subcategories: ["Hombre", "Mujer", "Niños", "Deportivas"],
            suggestedSizes: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"],
            icon: "👟",
        },
        Ropa: {
            subcategories: ["Hombre", "Mujer", "Niños", "Accesorios"],
            suggestedSizes: ["XS", "S", "M", "L", "XL", "XXL"],
            icon: "👕",
        },
        "Ollas y Accesorios de Cocina": {
            subcategories: ["Ollas", "Sartenes", "Utensilios", "Vajilla"],
            suggestedSizes: ["Pequeño", "Mediano", "Grande"],
            icon: "🧑‍🍳",
        },
    }
    // 🎯 ESTADO DEL FORMULARIO
    const [formData, setFormData] = useState<ProductFormData>({
        name: "",
        description: "",
        price: 0,
        category: "",
        subcategory: "",
        badge: "",
        sizes: [],
        images: [],
        imageUrls: [],
        inStock: true,
        stockCount: 1,
        features: [],
    })
    const [newSize, setNewSize] = useState("")
    const [newFeature, setNewFeature] = useState("")
    const [stockInput, setStockInput] = useState("1")
    // 🔥 VERIFICAR CONEXIÓN A CLOUDINARY AL CARGAR
    useEffect(() => {
        checkCloudinaryConnection()
        loadCategories()
    }, [])

    // 🔥 CARGAR CATEGORÍAS DESDE FIRESTORE
    const loadCategories = async () => {
        try {
            setLoadingCategories(true)
            const categories = await getCategories()
            setFirestoreCategories(categories)
        } catch (error) {
            console.error("Error loading categories:", error)
        } finally {
            setLoadingCategories(false)
        }
    }

    // 🔥 CARGAR SUBCATEGORÍAS CUANDO SE SELECCIONA UNA CATEGORÍA (para el formulario)
    useEffect(() => {
        if (formData.category) {
            console.log(`🔄 useEffect: Categoría seleccionada en formulario: ${formData.category}`)
            loadSubcategoriesForCategory(formData.category)
        } else {
            // Limpiar subcategorías si no hay categoría seleccionada
            setFirestoreSubcategories([])
        }
    }, [formData.category])

    // 🔥 CARGAR SUBCATEGORÍAS CUANDO SE SELECCIONA UNA CATEGORÍA (para el modal)
    useEffect(() => {
        if (selectedCategoryForSubcategory) {
            loadSubcategoriesForCategory(selectedCategoryForSubcategory)
        }
    }, [selectedCategoryForSubcategory])

    const loadSubcategoriesForCategory = async (categoryName: string) => {
        try {
            console.log(`🔄 Cargando subcategorías para: ${categoryName}`)
            const subcategories = await getSubcategories(categoryName)
            console.log(`✅ Subcategorías cargadas:`, subcategories)
            setFirestoreSubcategories(subcategories)
        } catch (error) {
            console.error("Error loading subcategories:", error)
            setFirestoreSubcategories([])
        }
    }

    // 🔥 COMBINAR CATEGORÍAS: Hardcodeadas + Firestore
    const getAllCategories = () => {
        const hardcodedCategories = Object.keys(categoriesData)
        const firestoreCategoryNames = firestoreCategories
            .filter((cat) => cat.isActive !== false)
            .map((cat) => cat.name)

        // Combinar y eliminar duplicados
        const allCategories = [...new Set([...hardcodedCategories, ...firestoreCategoryNames])]
        return allCategories.sort()
    }

    // 🔥 OBTENER DATOS DE CATEGORÍA (icono, subcategorías, etc.)
    const getCategoryData = (categoryName: string) => {
        // Primero buscar en hardcoded
        if (categoriesData[categoryName as keyof typeof categoriesData]) {
            return categoriesData[categoryName as keyof typeof categoriesData]
        }

        // Si no está en hardcoded, buscar en Firestore
        const firestoreCategory = firestoreCategories.find((cat) => cat.name === categoryName)
        if (firestoreCategory) {
            return {
                icon: firestoreCategory.icon || "📦",
                subcategories: [], // Se cargarán desde Firestore
                suggestedSizes: [],
            }
        }

        // Default
        return {
            icon: "📦",
            subcategories: [],
            suggestedSizes: [],
        }
    }

    // 🔥 OBTENER SUBCATEGORÍAS PARA UNA CATEGORÍA
    const getSubcategoriesForCategory = (categoryName: string): string[] => {
        // Obtener subcategorías hardcodeadas (si existen)
        const hardcodedData = categoriesData[categoryName as keyof typeof categoriesData]
        const hardcodedSubcats = hardcodedData ? hardcodedData.subcategories : []

        // Obtener subcategorías de Firestore
        const firestoreSubcats = firestoreSubcategories
            .filter((sub) => sub.category === categoryName)
            .map((sub) => sub.name)

        // Combinar ambas listas y eliminar duplicados
        const allSubcategories = [...new Set([...hardcodedSubcats, ...firestoreSubcats])]

        return allSubcategories
    }
    const checkCloudinaryConnection = async () => {
        try {
            setCloudinaryStatus("checking")
            setCloudinaryError("")
            console.log("🔧 Verificando conexión con Cloudinary...")
            const result = (await checkCloudinaryStatus()) as CloudinaryStatusResult
            if (result.success) {
                setCloudinaryStatus("connected")
                console.log("✅ Cloudinary conectado correctamente")
                showMessage("success", "Cloudinary conectado correctamente")
            } else {
                setCloudinaryStatus("error")
                setCloudinaryError(result.message || "Error desconocido")
                console.error("❌ Error de conexión a Cloudinary:", result.message)
                showMessage("error", `Error de Cloudinary: ${result.message}`)
            }
        } catch (error: any) {
            setCloudinaryStatus("error")
            const errorMsg = error.message || "Error desconocido"
            setCloudinaryError(errorMsg)
            console.error("❌ Error verificando Cloudinary:", error)
            showMessage("error", `No se pudo conectar a Cloudinary: ${errorMsg}`)
        }
    }
    // 🔥 MOSTRAR MENSAJE
    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 8000)
    }
    // 🔥 OBTENER TALLES SUGERIDOS PARA LA CATEGORÍA
    const getSuggestedSizes = (category: string): string[] => {
        const categoryData = categoriesData[category as keyof typeof categoriesData]
        return categoryData?.suggestedSizes || []
    }
    // 🔥 GENERAR DESCRIPCIÓN CON IA LOCAL INTELIGENTE
    const generateDescription = async () => {
        if (!formData.name.trim()) {
            showMessage("error", "Ingresa el nombre del producto primero")
            return
        }
        try {
            setGeneratingDescription(true)
            const response = await fetch("/api/generate-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formData.name,
                    category: formData.category,
                    subcategory: formData.subcategory,
                }),
            })
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "Error al generar descripción")
            }
            setFormData((prev) => ({
                ...prev,
                description: data.description,
            }))
            showMessage("success", "¡Descripción generada con IA!")
        } catch (error: any) {
            console.error("Error generating description:", error)
            showMessage("error", error.message || "Error al generar la descripción")
        } finally {
            setGeneratingDescription(false)
        }
    }
    // 🔥 MANEJAR CAMBIO DE CATEGORÍA
    const handleCategoryChange = (category: string) => {
        setFormData((prev) => ({
            ...prev,
            category,
            subcategory: "",
            sizes: [],
        }))
        setNewSize("")
    }
    // 🔥 MANEJAR CAMBIO DE STOCK
    const handleStockChange = (value: string) => {
        setStockInput(value)
        const numValue = Number.parseInt(value) || 0
        setFormData((prev) => ({
            ...prev,
            stockCount: Math.max(0, numValue),
        }))
    }
    // 🔥 CARGAR PRODUCTOS AL CAMBIAR TAB
    useEffect(() => {
        if (activeTab === "manage") {
            fetchProducts()
        }
    }, [activeTab])
    const fetchProducts = async () => {
        try {
            setLoadingProducts(true)
            const allProducts = await getProducts({})
            setProducts(allProducts)
        } catch (error) {
            console.error("Error fetching products:", error)
            showMessage("error", "Error al cargar productos")
        } finally {
            setLoadingProducts(false)
        }
    }
    // 🔥 MANEJAR SUBIDA DE IMÁGENES - CLOUDINARY MEJORADO CON TIPOS
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return
        console.log("📸 Archivos seleccionados:", files.length)
        // Verificar conexión a Cloudinary primero
        if (cloudinaryStatus !== "connected") {
            showMessage("error", "Error de conexión a Cloudinary. Haz clic en 'Reconectar' para intentar de nuevo.")
            return
        }
        // Validar archivos
        const validation = validateImages(files) as ValidationResult
        console.log("📋 Resultado de validación:", validation)
        // ✅ LÓGICA MEJORADA: Permitir archivos válidos aunque haya algunos inválidos
        if (!validation.valid) {
            console.error("❌ No hay archivos válidos:", validation.errors)
            showMessage("error", `No hay archivos válidos para subir: ${validation.errors.join(", ")}`)
            return
        }
        // Mostrar advertencia si hay archivos inválidos, pero continuar con los válidos
        if (validation.invalidCount > 0) {
            console.warn(`⚠️ ${validation.invalidCount} archivo(s) inválido(s) serán ignorados`)
            showMessage(
                "error",
                `${validation.invalidCount} archivo(s) inválido(s) ignorados. Subiendo ${validation.validFiles.length} archivo(s) válido(s).`,
            )
        }
        try {
            setUploadingImages(true)
            console.log("🔄 Iniciando subida de imágenes válidas a Cloudinary...")
            const result = (await uploadImages(validation.validFiles)) as UploadResult
            console.log("📊 Resultado de subida:", result)
            if (result.success && result.images && result.images.length > 0) {
                const newImageUrls = result.images.map((img) => img.url)
                setFormData((prev) => ({
                    ...prev,
                    images: [...prev.images, ...validation.validFiles.slice(0, result.uploaded)],
                    imageUrls: [...prev.imageUrls, ...newImageUrls],
                }))
                let successMessage = `${result.uploaded} imagen(es) subida(s) correctamente a Cloudinary`
                if (validation.invalidCount > 0) {
                    successMessage += ` (${validation.invalidCount} archivo(s) inválido(s) ignorados)`
                }
                showMessage("success", successMessage)
            } else {
                throw new Error(result.errors?.[0] || "No se pudieron subir las imágenes")
            }
            if (result.failed > 0 && result.errors && result.errors.length > 0) {
                console.warn("⚠️ Errores en subida:", result.errors)
                showMessage("error", `${result.failed} imagen(es) fallaron: ${result.errors.join(", ")}`)
            }
            // Limpiar el input
            e.target.value = ""
        } catch (error: any) {
            console.error("❌ Error uploading images:", error)
            showMessage("error", `Error al subir las imágenes: ${error.message}`)
        } finally {
            setUploadingImages(false)
        }
    }
    // 🔥 AGREGAR TALLE
    const addSize = () => {
        if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
            setFormData((prev) => ({
                ...prev,
                sizes: [...prev.sizes, newSize.trim()],
            }))
            setNewSize("")
        }
    }
    // 🔥 AGREGAR TALLE SUGERIDO
    const addSuggestedSize = (size: string) => {
        if (!formData.sizes.includes(size)) {
            setFormData((prev) => ({
                ...prev,
                sizes: [...prev.sizes, size],
            }))
        }
    }
    // 🔥 REMOVER TALLE
    const removeSize = (sizeToRemove: string) => {
        setFormData((prev) => ({
            ...prev,
            sizes: prev.sizes.filter((size) => size !== sizeToRemove),
        }))
    }
    // 🔥 AGREGAR CARACTERÍSTICA
    const addFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData((prev) => ({
                ...prev,
                features: [...prev.features, newFeature.trim()],
            }))
            setNewFeature("")
        }
    }
    // 🔥 REMOVER CARACTERÍSTICA
    const removeFeature = (featureToRemove: string) => {
        setFormData((prev) => ({
            ...prev,
            features: prev.features.filter((feature) => feature !== featureToRemove),
        }))
    }
    // 🔥 REMOVER IMAGEN
    const removeImage = (indexToRemove: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove),
            imageUrls: prev.imageUrls.filter((_, index) => index !== indexToRemove),
        }))
    }
    // 🔥 LIMPIAR FORMULARIO
    const clearForm = () => {
        setFormData({
            name: "",
            description: "",
            price: 0,
            category: "",
            subcategory: "",
            badge: "",
            sizes: [],
            images: [],
            imageUrls: [],
            inStock: true,
            stockCount: 1,
            features: [],
        })
        setNewSize("")
        setNewFeature("")
        setStockInput("1")
    }
    // 🔥 CREAR PRODUCTO
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // Validaciones
        if (!formData.name.trim()) {
            showMessage("error", "El nombre del producto es obligatorio")
            return
        }
        if (!formData.category) {
            showMessage("error", "La categoría es obligatoria")
            return
        }
        if (!formData.subcategory) {
            showMessage("error", "La subcategoría es obligatoria")
            return
        }
        if (formData.price <= 0) {
            showMessage("error", "El precio debe ser mayor a 0")
            return
        }
        if (formData.imageUrls.length === 0) {
            showMessage("error", "Por favor sube al menos una imagen")
            return
        }
        try {
            setLoading(true)
            const productData = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: formData.price,
                category: formData.category,
                subcategory: formData.subcategory,
                badge: formData.badge.trim() || "Nuevo",
                sizes: formData.sizes.length > 0 ? formData.sizes : null,
                images: formData.imageUrls,
                mainImage: formData.imageUrls[0],
                inStock: formData.inStock,
                stockCount: formData.stockCount,
                whatsappMessage: `Hola! Me interesa el producto: ${formData.name}. ¿Podrías darme más información?`,
                features: formData.features,
            }
            await createProduct(productData)
            showMessage("success", "¡Producto creado exitosamente!")
            clearForm()
            if (activeTab === "manage") {
                fetchProducts()
            }
        } catch (error) {
            console.error("Error creating product:", error)
            showMessage("error", "Error al crear el producto. Intenta nuevamente.")
        } finally {
            setLoading(false)
        }
    }
    // 🔥 ELIMINAR PRODUCTO
    const handleDeleteProduct = async (productId: string, productName: string) => {
        if (!confirm(`¿Estás segura de que quieres eliminar "${productName}"?`)) return
        try {
            await deleteProduct(productId)
            showMessage("success", "Producto eliminado correctamente")
            fetchProducts()
        } catch (error) {
            console.error("Error deleting product:", error)
            showMessage("error", "Error al eliminar el producto")
        }
    }
    // 🔥 TOGGLE STOCK
    const handleToggleStock = async (product: any) => {
        try {
            await updateProduct(product.id, { inStock: !product.inStock })
            showMessage("success", `Producto ${!product.inStock ? "activado" : "desactivado"} correctamente`)
            fetchProducts()
        } catch (error) {
            console.error("Error updating stock:", error)
            showMessage("error", "Error al actualizar el stock")
        }
    }

    // 🔥 INICIAR EDICIÓN DE IMÁGENES
    const startEditingImages = (product: any) => {
        setEditingProduct(product)
        setEditProductImages(product.images || []) // Initialize with existing images
    }

    // 🔥 MANEJAR SUBIDA DE IMÁGENES PARA EDICIÓN
    const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0 || !editingProduct) return

        if (cloudinaryStatus !== "connected") {
            showMessage("error", "Error de conexión a Cloudinary. Haz clic en 'Reconectar' para intentar de nuevo.")
            return
        }

        const validation = validateImages(files) as ValidationResult
        if (!validation.valid) {
            showMessage("error", `No hay archivos válidos para subir: ${validation.errors.join(", ")}`)
            return
        }

        if (validation.invalidCount > 0) {
            showMessage(
                "error",
                `${validation.invalidCount} archivo(s) inválido(s) ignorados. Subiendo ${validation.validFiles.length} archivo(s) válido(s).`,
            )
        }

        try {
            setUploadingImages(true)
            const result = (await uploadImages(validation.validFiles)) as UploadResult

            if (result.success && result.images && result.images.length > 0) {
                const newImageUrls = result.images.map((img) => img.url)
                setEditProductImages((prev) => [...prev, ...newImageUrls])
                showMessage("success", `${result.uploaded} imagen(es) subida(s) correctamente a Cloudinary`)
            } else {
                throw new Error(result.errors?.[0] || "No se pudieron subir las imágenes")
            }
            if (result.failed > 0 && result.errors && result.errors.length > 0) {
                showMessage("error", `${result.failed} imagen(es) fallaron: ${result.errors.join(", ")}`)
            }
            e.target.value = "" // Clear the input
        } catch (error: any) {
            console.error("❌ Error uploading images for edit:", error)
            showMessage("error", `Error al subir las imágenes: ${error.message}`)
        } finally {
            setUploadingImages(false)
        }
    }

    // 🔥 REMOVER IMAGEN PARA EDICIÓN
    const removeEditImage = (indexToRemove: number) => {
        setEditProductImages((prev) => prev.filter((_, index) => index !== indexToRemove))
    }

    // 🔥 GUARDAR CAMBIOS DE IMÁGENES
    const handleSaveEditedImages = async () => {
        if (!editingProduct) return

        try {
            setLoading(true)
            const updatedImages = editProductImages.filter(url => url.trim() !== ""); // Ensure no empty strings
            const mainImage = updatedImages.length > 0 ? updatedImages[0] : "/placeholder.svg?height=200&width=300"; // Set a default if no images

            await updateProduct(editingProduct.id, {
                images: updatedImages,
                mainImage: mainImage,
            })
            showMessage("success", "Imágenes del producto actualizadas exitosamente!")
            setEditingProduct(null) // Close the editing interface
            setEditProductImages([]) // Clear temporary images
            fetchProducts() // Refresh the product list
        } catch (error) {
            console.error("Error saving edited images:", error)
            showMessage("error", "Error al guardar las imágenes. Intenta nuevamente.")
        } finally {
            setLoading(false)
        }
    }

    // 🔥 CANCELAR EDICIÓN DE IMÁGENES
    const handleCancelEditImages = () => {
        setEditingProduct(null)
        setEditProductImages([])
    }

    // Funciones para crear categorías y subcategorías
    const closeCategoryModal = () => {
        setIsCategoryModalOpen(false)
        setNewCategoryName("")
        setNewCategoryIcon("📦")
        setNewCategoryDescription("")
        setNewSubcategoryName("")
        setSelectedCategoryForSubcategory("")
        setCreateSubcategoryWithCategory(false)
        setInitialSubcategoryName("")
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            showMessage("error", "Por favor ingresa un nombre para la categoría")
            return
        }

        // Validar subcategoría si se quiere crear
        if (createSubcategoryWithCategory && !initialSubcategoryName.trim()) {
            showMessage("error", "Por favor ingresa un nombre para la subcategoría")
            return
        }

        try {
            setCreatingCategory(true)

            // Guardar valores antes de limpiar
            const categoryNameToCreate = newCategoryName.trim()
            const subcategoryNameToCreate = initialSubcategoryName.trim()
            const shouldCreateSubcategory = createSubcategoryWithCategory && subcategoryNameToCreate

            // Crear la categoría con subcategorías si corresponde
            const subcategoriesArray = shouldCreateSubcategory ? [subcategoryNameToCreate] : []

            const newCategory = await createCategory({
                name: categoryNameToCreate,
                icon: newCategoryIcon || "📦",
                description: newCategoryDescription.trim(),
                subcategories: subcategoriesArray,
            })

            if (shouldCreateSubcategory) {
                showMessage("success", `¡Categoría "${categoryNameToCreate}" y subcategoría "${subcategoryNameToCreate}" creadas exitosamente!`)
            } else {
                showMessage("success", `¡Categoría "${categoryNameToCreate}" creada exitosamente!`)
            }

            setNewCategoryName("")
            setNewCategoryIcon("📦")
            setNewCategoryDescription("")
            setCreateSubcategoryWithCategory(false)
            setInitialSubcategoryName("")

            // Recargar categorías desde Firestore
            await loadCategories()

            // Si se creó subcategoría, recargar subcategorías para que aparezcan inmediatamente
            if (shouldCreateSubcategory) {
                // Esperar un poco para que Firestore procese la subcategoría
                await new Promise(resolve => setTimeout(resolve, 1000))
                // Cargar subcategorías para la nueva categoría
                console.log(`🔄 Recargando subcategorías para: ${categoryNameToCreate}`)
                await loadSubcategoriesForCategory(categoryNameToCreate)
                // Si la categoría está seleccionada en el formulario, recargar también
                if (formData.category === categoryNameToCreate) {
                    await loadSubcategoriesForCategory(formData.category)
                }
            }

            closeCategoryModal()

            // Recargar subcategorías una vez más después de cerrar el modal
            // para asegurarse de que estén disponibles
            if (shouldCreateSubcategory && formData.category === categoryNameToCreate) {
                setTimeout(async () => {
                    console.log(`🔄 Recarga final de subcategorías para: ${formData.category}`)
                    await loadSubcategoriesForCategory(formData.category)
                }, 1500)
            }
        } catch (error: any) {
            console.error("Error creating category:", error)
            showMessage("error", `Error al crear la categoría: ${error.message}`)
        } finally {
            setCreatingCategory(false)
        }
    }

    // 🔥 ELIMINAR CATEGORÍA
    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}"?\n\nEsto también eliminará todas las subcategorías asociadas.`)) {
            return
        }

        try {
            // Primero eliminar todas las subcategorías de esta categoría
            await deleteSubcategoriesByCategory(categoryName)

            // Luego eliminar la categoría
            await deleteCategory(categoryId)

            showMessage("success", `Categoría "${categoryName}" eliminada correctamente`)

            // Recargar categorías
            await loadCategories()

            // Si la categoría eliminada estaba seleccionada, limpiar el formulario
            if (formData.category === categoryName) {
                setFormData((prev) => ({
                    ...prev,
                    category: "",
                    subcategory: "",
                }))
            }
        } catch (error: any) {
            console.error("Error deleting category:", error)
            showMessage("error", `Error al eliminar la categoría: ${error.message}`)
        }
    }

    // 🔥 ELIMINAR SUBCATEGORÍA
    const handleDeleteSubcategory = async (subcategoryId: string, subcategoryName: string) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar la subcategoría "${subcategoryName}"?`)) {
            return
        }

        try {
            // El subcategoryId tiene formato: categoryId_index
            // Extraer categoryId (primera parte antes del guion bajo)
            const categoryId = subcategoryId.split("_")[0]

            await deleteSubcategory(categoryId, subcategoryName)
            showMessage("success", `Subcategoría "${subcategoryName}" eliminada correctamente`)

            // Recargar subcategorías si la categoría está seleccionada
            if (formData.category) {
                await loadSubcategoriesForCategory(formData.category)
            }

            // Si la subcategoría eliminada estaba seleccionada, limpiarla
            if (formData.subcategory === subcategoryName) {
                setFormData((prev) => ({
                    ...prev,
                    subcategory: "",
                }))
            }
        } catch (error: any) {
            console.error("Error deleting subcategory:", error)
            showMessage("error", `Error al eliminar la subcategoría: ${error.message}`)
        }
    }

    const handleCreateSubcategory = async () => {
        if (!newSubcategoryName.trim()) {
            showMessage("error", "Por favor ingresa un nombre para la subcategoría")
            return
        }

        if (!selectedCategoryForSubcategory) {
            showMessage("error", "Por favor selecciona una categoría")
            return
        }

        try {
            setCreatingSubcategory(true)

            // Buscar la categoría por nombre para obtener su ID
            const categories = await getCategories()
            const categoryToUpdate = categories.find((cat: any) => cat.name === selectedCategoryForSubcategory)

            if (!categoryToUpdate || !categoryToUpdate.id) {
                throw new Error("Categoría no encontrada")
            }

            // Agregar la subcategoría al documento de la categoría
            await addSubcategoryToCategory(categoryToUpdate.id, newSubcategoryName.trim())

            showMessage("success", `¡Subcategoría "${newSubcategoryName}" creada exitosamente para la categoría "${selectedCategoryForSubcategory}"!`)

            const categoryToKeep = selectedCategoryForSubcategory // Guardar la categoría antes de limpiar
            setNewSubcategoryName("") // Limpiar solo el nombre, NO la categoría seleccionada

            // Recargar subcategorías para mostrar la nueva inmediatamente
            await new Promise((resolve) => setTimeout(resolve, 500))
            await loadSubcategoriesForCategory(categoryToKeep)

            // También recargar si la categoría está seleccionada en el formulario
            if (formData.category === categoryToKeep) {
                await loadSubcategoriesForCategory(formData.category)
            }
        } catch (error: any) {
            console.error("Error creating subcategory:", error)
            showMessage("error", `Error al crear la subcategoría: ${error.message}`)
        } finally {
            setCreatingSubcategory(false)
        }
    }

    // 🔧 AGREGAR SUBCATEGORÍA A CATEGORÍA EXISTENTE (desde el modal de edición)
    const handleAddSubcategoryToCategory = async (categoryId: string) => {
        if (!newSubcategoryNameToAdd.trim()) {
            showMessage("error", "Por favor ingresa un nombre para la subcategoría")
            return
        }

        try {
            setAddingSubcategory(true)

            // Obtener la categoría para verificar cuántas subcategorías tiene
            const category = firestoreCategories.find((cat) => cat.id === categoryId)
            if (!category) {
                throw new Error("Categoría no encontrada")
            }

            const currentSubcategories = category.subcategories || []
            if (currentSubcategories.length >= 10) {
                showMessage("error", "No puedes agregar más de 10 subcategorías por categoría")
                return
            }

            // Verificar que no exista ya
            if (currentSubcategories.includes(newSubcategoryNameToAdd.trim())) {
                showMessage("error", "Esta subcategoría ya existe")
                return
            }

            // Agregar la subcategoría
            await addSubcategoryToCategory(categoryId, newSubcategoryNameToAdd.trim())

            showMessage("success", `¡Subcategoría "${newSubcategoryNameToAdd}" agregada exitosamente!`)

            // Recargar categorías
            await loadCategories()
            setNewSubcategoryNameToAdd("")
        } catch (error: any) {
            console.error("Error adding subcategory:", error)
            showMessage("error", `Error al agregar la subcategoría: ${error.message}`)
        } finally {
            setAddingSubcategory(false)
        }
    }

    // 🗑️ ELIMINAR SUBCATEGORÍA DE CATEGORÍA
    const handleRemoveSubcategory = async (categoryId: string, subcategoryName: string) => {
        try {
            await deleteSubcategory(categoryId, subcategoryName)
            showMessage("success", `Subcategoría "${subcategoryName}" eliminada correctamente`)

            // Recargar categorías
            await loadCategories()
        } catch (error: any) {
            console.error("Error removing subcategory:", error)
            showMessage("error", `Error al eliminar la subcategoría: ${error.message}`)
        }
    }

    // Estadísticas
    const totalProducts = products.length
    const activeProducts = products.filter((p: any) => p.inStock).length
    const totalValue = products.reduce((sum: number, p: any) => sum + p.price * (p.stockCount || 1), 0)
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#f5f0ed] to-[#ebcfc4]">
            {/* 📱 HEADER RESPONSIVE */}
            <header className="bg-white/95 backdrop-blur-md border-b border-[#ebcfc4] sticky top-0 z-50 shadow-sm">
                <div className="container mx-auto px-4 py-3 lg:py-4">
                    {/* 📱 MOBILE HEADER */}
                    <div className="flex items-center justify-between lg:hidden">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-[#9d6a4e] hover:bg-[#f5f0ed] p-2">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div className="text-center">
                            <h1 className="text-lg font-bold text-[#9d6a4e]">Panel Admin</h1>
                            <div className="flex items-center justify-center space-x-1">
                                {cloudinaryStatus === "checking" && <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />}
                                {cloudinaryStatus === "connected" && <Cloud className="w-3 h-3 text-green-500" />}
                                {cloudinaryStatus === "error" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                <span className="text-xs text-gray-500">
                                    {cloudinaryStatus === "checking" && "Verificando..."}
                                    {cloudinaryStatus === "connected" && "OK"}
                                    {cloudinaryStatus === "error" && "Error"}
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-[#9d6a4e] hover:bg-[#f5f0ed] p-2"
                        >
                            <Menu className="w-4 h-4" />
                        </Button>
                    </div>
                    {/* 🖥️ DESKTOP HEADER */}
                    <div className="hidden lg:flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link href="/">
                                <Button variant="ghost" size="sm" className="text-[#9d6a4e] hover:bg-[#f5f0ed]">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Volver a la Tienda
                                </Button>
                            </Link>
                            <div className="h-6 w-px bg-[#ebcfc4]" />
                            <div>
                                <h1 className="text-xl font-bold text-[#9d6a4e]">Panel de Administración</h1>
                                <div className="flex items-center space-x-2">
                                    <p className="text-sm text-[#b38872]">Gestiona tus productos con IA</p>
                                    <div className="flex items-center space-x-1">
                                        {cloudinaryStatus === "checking" && <Loader2 className="w-3 h-3 animate-spin text-yellow-500" />}
                                        {cloudinaryStatus === "connected" && <Cloud className="w-3 h-3 text-green-500" />}
                                        {cloudinaryStatus === "error" && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                        <span className="text-xs text-gray-500">
                                            {cloudinaryStatus === "checking" && "Verificando..."}
                                            {cloudinaryStatus === "connected" && "Cloudinary OK"}
                                            {cloudinaryStatus === "error" && "Configuración requerida"}
                                        </span>
                                        {cloudinaryStatus === "error" && (
                                            <Button
                                                onClick={checkCloudinaryConnection}
                                                size="sm"
                                                variant="ghost"
                                                className="h-6 px-2 text-xs text-red-600 hover:bg-red-50"
                                            >
                                                <RefreshCw className="w-3 h-3 mr-1" />
                                                Reconectar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                onClick={() => setActiveTab("create")}
                                variant={activeTab === "create" ? "default" : "outline"}
                                size="sm"
                                className={
                                    activeTab === "create"
                                        ? "bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                        : "border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                                }
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear Producto
                            </Button>
                            <Button
                                onClick={() => setIsCategoryModalOpen(true)}
                                variant="outline"
                                size="sm"
                                className="border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                            >
                                <FolderPlus className="w-4 h-4 mr-2" />
                                Categorías
                            </Button>
                            <Button
                                onClick={() => setActiveTab("manage")}
                                variant={activeTab === "manage" ? "default" : "outline"}
                                size="sm"
                                className={
                                    activeTab === "manage"
                                        ? "bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                        : "border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                                }
                            >
                                <Package className="w-4 h-4 mr-2" />
                                Gestionar ({products.length})
                            </Button>
                        </div>
                    </div>
                    {/* 📱 MOBILE MENU */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden mt-4 pt-4 border-t border-[#ebcfc4] space-y-3">
                            <div className="flex flex-col space-y-2">
                                <Button
                                    onClick={() => {
                                        setActiveTab("create")
                                        setIsMobileMenuOpen(false)
                                    }}
                                    variant={activeTab === "create" ? "default" : "outline"}
                                    size="sm"
                                    className={`w-full justify-start ${activeTab === "create"
                                        ? "bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                        : "border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                                        }`}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Crear Producto
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsCategoryModalOpen(true)
                                        setIsMobileMenuOpen(false)
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                                >
                                    <FolderPlus className="w-4 h-4 mr-2" />
                                    Categorías
                                </Button>
                                <Button
                                    onClick={() => {
                                        setActiveTab("manage")
                                        setIsMobileMenuOpen(false)
                                    }}
                                    variant={activeTab === "manage" ? "default" : "outline"}
                                    size="sm"
                                    className={`w-full justify-start ${activeTab === "manage"
                                        ? "bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                        : "border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                                        }`}
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    Gestionar ({products.length})
                                </Button>
                            </div>
                            {cloudinaryStatus === "error" && (
                                <Button
                                    onClick={checkCloudinaryConnection}
                                    size="sm"
                                    variant="outline"
                                    className="w-full text-red-600 border-red-200 hover:bg-red-50 bg-transparent"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reconectar Cloudinary
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </header>
            {/* 📱 MESSAGE ALERT RESPONSIVE */}
            {message && (
                <div className="container mx-auto px-4 pt-4">
                    <div
                        className={`flex items-start p-3 lg:p-4 rounded-lg shadow-sm ${message.type === "success"
                            ? "bg-green-50 border border-green-200 text-green-800"
                            : "bg-red-50 border border-red-200 text-red-800"
                            }`}
                    >
                        {message.type === "success" ? (
                            <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-2 flex-shrink-0 mt-0.5" />
                        ) : (
                            <AlertCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-2 flex-shrink-0 mt-0.5" />
                        )}
                        <span className="font-medium text-sm lg:text-base flex-1 pr-2">{message.text}</span>
                        <button onClick={() => setMessage(null)} className="text-current hover:opacity-70 flex-shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
            {/* 🔥 ALERTA DE CONFIGURACIÓN DE CLOUDINARY RESPONSIVE */}
            {cloudinaryStatus === "error" && (
                <div className="container mx-auto px-4 pt-4">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4 lg:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-start space-y-3 lg:space-y-0 lg:space-x-3">
                                <Settings className="w-6 h-6 text-red-600 flex-shrink-0" />
                                <div className="flex-1 space-y-3">
                                    <h3 className="font-semibold text-red-800 text-base lg:text-lg">
                                        ⚡ Configuración de Cloudinary requerida
                                    </h3>
                                    <p className="text-red-700 text-sm lg:text-base">
                                        Para subir imágenes necesitas configurar Cloudinary (no Firebase). Error: {cloudinaryError}
                                    </p>
                                    <div className="bg-red-100 p-3 lg:p-4 rounded-lg space-y-3">
                                        <p className="text-sm lg:text-base text-red-800 font-medium">
                                            🔧 Pasos para configurar Cloudinary:
                                        </p>
                                        <ol className="text-sm lg:text-base text-red-700 space-y-2 list-decimal list-inside">
                                            <li>
                                                Ve a <strong>cloudinary.com</strong> y crea una cuenta gratuita
                                            </li>
                                            <li>
                                                Ve a <strong>Dashboard → Settings → API Keys</strong>
                                            </li>
                                            <li>Copia: Cloud Name, API Key, API Secret</li>
                                            <li>
                                                En Railway, ve a tu proyecto → <strong>Variables</strong>
                                            </li>
                                            <li>Agrega estas variables de entorno:</li>
                                            <ul className="ml-4 mt-2 space-y-1 list-disc list-inside text-xs lg:text-sm">
                                                <li>
                                                    <code className="bg-red-200 px-1 rounded">CLOUDINARY_CLOUD_NAME=dwnjpcjhi</code>
                                                </li>
                                                <li>
                                                    <code className="bg-red-200 px-1 rounded">CLOUDINARY_API_KEY=163361771712489</code>
                                                </li>
                                                <li>
                                                    <code className="bg-red-200 px-1 rounded">CLOUDINARY_API_SECRET=tu_api_secret_aqui</code>
                                                </li>
                                            </ul>
                                            <li>
                                                Haz <strong>Redeploy</strong> en Railway
                                            </li>
                                        </ol>
                                    </div>
                                    <div className="bg-blue-100 p-3 lg:p-4 rounded-lg">
                                        <p className="text-sm lg:text-base text-blue-800 font-medium mb-2">
                                            ☁️ ¿Por qué Cloudinary y no Firebase?
                                        </p>
                                        <ul className="text-sm lg:text-base text-blue-700 space-y-1">
                                            <li>• Railway tiene sistema de archivos efímero (se reinicia)</li>
                                            <li>• Cloudinary es gratuito hasta 25GB y 25,000 transformaciones/mes</li>
                                            <li>• Optimización automática de imágenes</li>
                                            <li>• CDN global para carga rápida</li>
                                            <li>• Mejor para aplicaciones en Railway/Vercel</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            <div className="container mx-auto px-4 py-4 lg:py-8">
                {/* 📊 STATS CARDS RESPONSIVE - Solo en gestión */}
                {activeTab === "manage" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
                        <Card>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#b38872]">Total Productos</p>
                                        <p className="text-xl lg:text-2xl font-bold text-[#9d6a4e]">{totalProducts}</p>
                                    </div>
                                    <Package className="w-6 h-6 lg:w-8 lg:h-8 text-[#ebcfc4]" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#b38872]">Productos Activos</p>
                                        <p className="text-xl lg:text-2xl font-bold text-green-600">{activeProducts}</p>
                                    </div>
                                    <TrendingUp className="w-6 h-6 lg:w-8 lg:h-8 text-green-400" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="sm:col-span-2 lg:col-span-1">
                            <CardContent className="p-4 lg:p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-[#b38872]">Valor Total</p>
                                        <p className="text-lg lg:text-2xl font-bold text-[#9d6a4e]">ARS ${totalValue.toLocaleString()}</p>
                                    </div>
                                    <ShoppingCart className="w-6 h-6 lg:w-8 lg:h-8 text-[#ebcfc4]" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* 📝 CREAR PRODUCTO RESPONSIVE */}
                {activeTab === "create" && (
                    <div className="max-w-4xl mx-auto">
                        <Card className="border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-[#ebcfc4] to-[#d4b5a8] text-white p-4 lg:p-6">
                                <CardTitle className="flex items-center text-lg lg:text-xl">
                                    <Plus className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                                    Crear Nuevo Producto
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6">
                                    {/* 📱 INFORMACIÓN BÁSICA RESPONSIVE */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <Label
                                                    htmlFor="name"
                                                    className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base"
                                                >
                                                    <Tag className="w-4 h-4 mr-2" />
                                                    Nombre del Producto *
                                                </Label>
                                                <Input
                                                    id="name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Ej: Nike Air Max 270 Hombre"
                                                    className="mt-1"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="price"
                                                    className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base"
                                                >
                                                    <DollarSign className="w-4 h-4 mr-2" />
                                                    Precio (ARS) *
                                                </Label>
                                                <Input
                                                    id="price"
                                                    type="text"
                                                    value={formData.price === 0 ? "" : formData.price.toString()}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        const numValue = value === "" ? 0 : Number(value.replace(/[^0-9]/g, ""))
                                                        setFormData((prev) => ({ ...prev, price: numValue }))
                                                    }}
                                                    placeholder="25999"
                                                    className="mt-1"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="badge"
                                                    className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base"
                                                >
                                                    <Star className="w-4 h-4 mr-2" />
                                                    Badge/Etiqueta
                                                </Label>
                                                <Input
                                                    id="badge"
                                                    value={formData.badge}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, badge: e.target.value }))}
                                                    placeholder="Ej: Nuevo, Oferta, Premium"
                                                    className="mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label
                                                    htmlFor="stockCount"
                                                    className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base"
                                                >
                                                    <Package className="w-4 h-4 mr-2" />
                                                    Cantidad en Stock
                                                </Label>
                                                <Input
                                                    id="stockCount"
                                                    type="text"
                                                    value={stockInput}
                                                    onChange={(e) => handleStockChange(e.target.value)}
                                                    placeholder="Ej: 10"
                                                    className="mt-1"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="category" className="text-[#9d6a4e] font-medium text-sm lg:text-base">
                                                    Categoría *
                                                </Label>
                                                <Select value={formData.category} onValueChange={handleCategoryChange}>
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Seleccionar categoría" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {loadingCategories ? (
                                                            <div className="px-2 py-1.5 text-sm text-gray-500">
                                                                Cargando categorías...
                                                            </div>
                                                        ) : (
                                                            getAllCategories().map((category) => {
                                                                const categoryData = getCategoryData(category)
                                                                return (
                                                                    <SelectItem key={category} value={category}>
                                                                        <span className="flex items-center">
                                                                            <span className="mr-2">{categoryData.icon}</span>
                                                                            {category}
                                                                        </span>
                                                                    </SelectItem>
                                                                )
                                                            })
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="subcategory" className="text-[#9d6a4e] font-medium text-sm lg:text-base">
                                                    Subcategoría *
                                                </Label>
                                                <Select
                                                    value={formData.subcategory}
                                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, subcategory: value }))}
                                                    disabled={!formData.category}
                                                >
                                                    <SelectTrigger className="mt-1">
                                                        <SelectValue placeholder="Seleccionar subcategoría" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {formData.category &&
                                                            getSubcategoriesForCategory(formData.category).map((subcategory) => (
                                                                <SelectItem key={subcategory} value={subcategory}>
                                                                    {subcategory}
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    id="inStock"
                                                    checked={formData.inStock}
                                                    onChange={(e) => setFormData((prev) => ({ ...prev, inStock: e.target.checked }))}
                                                    className="rounded border-[#ebcfc4]"
                                                />
                                                <Label htmlFor="inStock" className="text-[#9d6a4e] font-medium text-sm lg:text-base">
                                                    Producto disponible en stock
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                    {/* 📝 DESCRIPCIÓN CON IA RESPONSIVE */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                            <Label
                                                htmlFor="description"
                                                className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base"
                                            >
                                                <FileText className="w-4 h-4 mr-2" />
                                                Descripción
                                            </Label>
                                            <Button
                                                type="button"
                                                onClick={generateDescription}
                                                disabled={generatingDescription || !formData.name.trim()}
                                                size="sm"
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 w-full sm:w-auto"
                                            >
                                                {generatingDescription ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Analizando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="w-4 h-4 mr-2" />
                                                        Generar con IA
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                            placeholder="Descripción detallada del producto... (o usa el botón 'Generar con IA')"
                                            className="mt-1"
                                            rows={4}
                                        />
                                    </div>
                                    {/* 📏 TALLES RESPONSIVE */}
                                    <div>
                                        <Label className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base">
                                            <Ruler className="w-4 h-4 mr-2" />
                                            Talles Disponibles
                                            {formData.category && (
                                                <span className="ml-2 text-xs lg:text-sm text-gray-500">
                                                    (Sugeridos para {formData.category})
                                                </span>
                                            )}
                                        </Label>
                                        {formData.category && getSuggestedSizes(formData.category).length > 0 && (
                                            <div className="mt-2 mb-3">
                                                <p className="text-xs lg:text-sm text-gray-600 mb-2">
                                                    Talles sugeridos para {formData.category}:
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {getSuggestedSizes(formData.category).map((size) => (
                                                        <Button
                                                            key={size}
                                                            type="button"
                                                            onClick={() => addSuggestedSize(size)}
                                                            size="sm"
                                                            variant="outline"
                                                            className={`text-xs ${formData.sizes.includes(size)
                                                                ? "bg-[#ebcfc4] text-[#9d6a4e] border-[#ebcfc4]"
                                                                : "border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed]"
                                                                }`}
                                                            disabled={formData.sizes.includes(size)}
                                                        >
                                                            {formData.sizes.includes(size) ? "✓ " : ""}
                                                            {size}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newSize}
                                                    onChange={(e) => setNewSize(e.target.value)}
                                                    placeholder={
                                                        formData.category === "Zapatillas"
                                                            ? "Ej: 38, 39, 40"
                                                            : formData.category === "Ropa"
                                                                ? "Ej: S, M, L"
                                                                : "Ej: Pequeño, Mediano, Grande"
                                                    }
                                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSize())}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={addSize}
                                                    size="sm"
                                                    className="bg-[#ebcfc4] hover:bg-[#d4b5a8] text-[#9d6a4e] px-3"
                                                    disabled={!newSize.trim()}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {formData.sizes.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.sizes.map((size, index) => (
                                                        <Badge key={index} variant="secondary" className="bg-[#f5f0ed] text-[#9d6a4e]">
                                                            {size}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeSize(size)}
                                                                className="ml-2 text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* 🎨 CARACTERÍSTICAS RESPONSIVE */}
                                    <div>
                                        <Label className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base">
                                            <Palette className="w-4 h-4 mr-2" />
                                            Características
                                        </Label>
                                        <div className="mt-2 space-y-2">
                                            <div className="flex gap-2">
                                                <Input
                                                    value={newFeature}
                                                    onChange={(e) => setNewFeature(e.target.value)}
                                                    placeholder="Ej: Importado, Alta calidad, Garantía"
                                                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={addFeature}
                                                    size="sm"
                                                    className="bg-[#ebcfc4] hover:bg-[#d4b5a8] text-[#9d6a4e] px-3"
                                                    disabled={!newFeature.trim()}
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            {formData.features.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.features.map((feature, index) => (
                                                        <Badge key={index} variant="secondary" className="bg-[#f5f0ed] text-[#9d6a4e]">
                                                            {feature}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFeature(feature)}
                                                                className="ml-2 text-red-500 hover:text-red-700"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* 🖼️ IMÁGENES RESPONSIVE */}
                                    <div>
                                        <Label className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base">
                                            <ImageIcon className="w-4 h-4 mr-2" />
                                            Imágenes del Producto *
                                        </Label>
                                        <div className="mt-2 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <div className="flex items-start space-x-2">
                                                <Cloud className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs lg:text-sm text-blue-800">
                                                    <strong>Cloudinary CDN:</strong> Las imágenes se suben a Cloudinary (no Firebase) y se
                                                    optimizan automáticamente. Compatible con Railway y otros hosts.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <div
                                                className={`border-2 border-dashed rounded-lg p-4 lg:p-6 text-center transition-colors ${cloudinaryStatus === "connected"
                                                    ? "border-[#ebcfc4] hover:border-[#d4b5a8] bg-white"
                                                    : "border-red-300 bg-red-50"
                                                    }`}
                                            >
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    id="image-upload"
                                                    disabled={uploadingImages || cloudinaryStatus !== "connected"}
                                                />
                                                <label
                                                    htmlFor="image-upload"
                                                    className={`cursor-pointer block ${cloudinaryStatus !== "connected" ? "cursor-not-allowed" : ""
                                                        }`}
                                                >
                                                    {uploadingImages ? (
                                                        <Loader2 className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 text-[#9d6a4e] animate-spin" />
                                                    ) : cloudinaryStatus === "error" ? (
                                                        <AlertTriangle className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 text-red-500" />
                                                    ) : (
                                                        <Upload className="w-8 h-8 lg:w-12 lg:h-12 mx-auto mb-3 text-[#9d6a4e]" />
                                                    )}
                                                    <p
                                                        className={`text-base lg:text-lg font-medium mb-2 ${cloudinaryStatus === "connected" ? "text-[#9d6a4e]" : "text-red-600"
                                                            }`}
                                                    >
                                                        {uploadingImages
                                                            ? "Subiendo a Cloudinary..."
                                                            : cloudinaryStatus === "error"
                                                                ? "Configuración de Cloudinary requerida"
                                                                : "Haz clic para subir imágenes"}
                                                    </p>
                                                    <p className="text-xs lg:text-sm text-gray-500">
                                                        {cloudinaryStatus === "error"
                                                            ? "Configura Cloudinary para subir imágenes"
                                                            : "JPG, PNG, WebP, GIF - Máximo 10MB por imagen"}
                                                    </p>
                                                </label>
                                            </div>
                                            {/* 🖼️ PREVIEW DE IMÁGENES RESPONSIVE */}
                                            {formData.imageUrls.length > 0 && (
                                                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                                                    {formData.imageUrls.map((url, index) => (
                                                        <div key={index} className="relative group">
                                                            <img
                                                                src={url || "/placeholder.svg"}
                                                                alt={`Imagen ${index + 1}`}
                                                                className="w-full h-20 lg:h-24 object-cover rounded-lg border border-[#ebcfc4]"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            {index === 0 && (
                                                                <Badge className="absolute bottom-1 left-1 text-xs bg-[#9d6a4e]">Principal</Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {/* 🔘 BOTONES RESPONSIVE */}
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3 pt-4 lg:pt-6">
                                        <Button
                                            type="button"
                                            onClick={clearForm}
                                            variant="outline"
                                            className="border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed] bg-transparent w-full sm:w-auto"
                                        >
                                            Limpiar
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={loading || uploadingImages || cloudinaryStatus !== "connected"}
                                            className="bg-[#9d6a4e] hover:bg-[#b38872] text-white w-full sm:w-auto"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Creando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Crear Producto
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
                {/* 📦 GESTIONAR PRODUCTOS RESPONSIVE */}
                {activeTab === "manage" && (
                    <div>
                        <Card className="border-0 shadow-xl">
                            <CardHeader className="bg-gradient-to-r from-[#ebcfc4] to-[#d4b5a8] text-white p-4 lg:p-6">
                                <CardTitle className="flex items-center text-lg lg:text-xl">
                                    <Package className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                                    Gestión de Productos
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 lg:p-6">
                                {loadingProducts ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-6 h-6 lg:w-8 lg:h-8 animate-spin text-[#9d6a4e]" />
                                        <span className="ml-2 text-[#9d6a4e] text-sm lg:text-base">Cargando productos...</span>
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Package className="w-12 h-12 lg:w-16 lg:h-16 mx-auto text-[#ebcfc4] mb-4" />
                                        <h3 className="text-base lg:text-lg font-medium text-[#9d6a4e] mb-2">No hay productos</h3>
                                        <p className="text-[#b38872] mb-4 text-sm lg:text-base">Crea tu primer producto para comenzar</p>
                                        <Button
                                            onClick={() => setActiveTab("create")}
                                            className="bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Crear Primer Producto
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Image Editing Section/Modal */}
                                        {editingProduct && (
                                            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                                <Card className="w-full max-w-2xl border-0 shadow-xl">
                                                    <CardHeader className="bg-gradient-to-r from-[#ebcfc4] to-[#d4b5a8] text-white p-4">
                                                        <CardTitle className="flex items-center text-lg">
                                                            <ImageIcon className="w-4 h-4 mr-2" />
                                                            Gestionar Imágenes para "{editingProduct.name}"
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-4 space-y-4">
                                                        <div>
                                                            <Label className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base">
                                                                <ImageIcon className="w-4 h-4 mr-2" />
                                                                Imágenes Actuales
                                                            </Label>
                                                            <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2">
                                                                {editProductImages.length > 0 ? (
                                                                    editProductImages.map((url, index) => (
                                                                        <div key={index} className="relative group">
                                                                            <img
                                                                                src={url || "/placeholder.svg?height=200&width=300"}
                                                                                alt={`Imagen ${index + 1}`}
                                                                                className="w-full h-20 object-cover rounded-lg border border-[#ebcfc4]"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => removeEditImage(index)}
                                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                            {index === 0 && (
                                                                                <Badge className="absolute bottom-1 left-1 text-xs bg-[#9d6a4e]">Principal</Badge>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <p className="text-sm text-gray-500 col-span-full">No hay imágenes para este producto.</p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <Label className="text-[#9d6a4e] font-medium flex items-center text-sm lg:text-base">
                                                                <Upload className="w-4 h-4 mr-2" />
                                                                Añadir Nuevas Imágenes
                                                            </Label>
                                                            <div
                                                                className={`mt-2 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${cloudinaryStatus === "connected"
                                                                    ? "border-[#ebcfc4] hover:border-[#d4b5a8] bg-white"
                                                                    : "border-red-300 bg-red-50"
                                                                    }`}
                                                            >
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    accept="image/*"
                                                                    onChange={handleEditImageUpload}
                                                                    className="hidden"
                                                                    id="edit-image-upload"
                                                                    disabled={uploadingImages || cloudinaryStatus !== "connected"}
                                                                />
                                                                <label
                                                                    htmlFor="edit-image-upload"
                                                                    className={`cursor-pointer block ${cloudinaryStatus !== "connected" ? "cursor-not-allowed" : ""
                                                                        }`}
                                                                >
                                                                    {uploadingImages ? (
                                                                        <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#9d6a4e] animate-spin" />
                                                                    ) : cloudinaryStatus === "error" ? (
                                                                        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-red-500" />
                                                                    ) : (
                                                                        <Upload className="w-8 h-8 mx-auto mb-3 text-[#9d6a4e]" />
                                                                    )}
                                                                    <p
                                                                        className={`text-base font-medium mb-2 ${cloudinaryStatus === "connected" ? "text-[#9d6a4e]" : "text-red-600"
                                                                            }`}
                                                                    >
                                                                        {uploadingImages
                                                                            ? "Subiendo a Cloudinary..."
                                                                            : cloudinaryStatus === "error"
                                                                                ? "Configuración de Cloudinary requerida"
                                                                                : "Haz clic para añadir imágenes"}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {cloudinaryStatus === "error"
                                                                            ? "Configura Cloudinary para subir imágenes"
                                                                            : "JPG, PNG, WebP, GIF - Máximo 10MB por imagen"}
                                                                    </p>
                                                                </label>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-end gap-2 pt-4">
                                                            <Button
                                                                type="button"
                                                                onClick={handleCancelEditImages}
                                                                variant="outline"
                                                                className="border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed] bg-transparent"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                onClick={handleSaveEditedImages}
                                                                disabled={loading || uploadingImages || cloudinaryStatus !== "connected"}
                                                                className="bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                                            >
                                                                {loading ? (
                                                                    <>
                                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                                        Guardando...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Save className="w-4 h-4 mr-2" />
                                                                        Guardar Cambios
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}

                                        {/* Existing Product Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                                            {products.map((product: any) => (
                                                <Card key={product.id} className="border border-[#ebcfc4] hover:shadow-lg transition-shadow">
                                                    <div className="relative">
                                                        <img
                                                            src={product.mainImage || product.images?.[0] || "/placeholder.svg?height=200&width=300"}
                                                            alt={product.name}
                                                            className="w-full h-40 lg:h-48 object-cover rounded-t-lg"
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement
                                                                target.src = "/placeholder.svg?height=200&width=300"
                                                            }}
                                                        />
                                                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                                                            <Badge
                                                                variant={product.inStock ? "default" : "secondary"}
                                                                className={`${product.inStock ? "bg-green-500" : "bg-gray-500"} text-xs`}
                                                            >
                                                                {product.inStock ? "En Stock" : "Sin Stock"}
                                                            </Badge>
                                                            {product.badge && <Badge className="bg-[#9d6a4e] text-xs">{product.badge}</Badge>}
                                                        </div>
                                                    </div>
                                                    <CardContent className="p-3 lg:p-4">
                                                        <h3 className="font-semibold text-[#9d6a4e] mb-2 line-clamp-2 text-sm lg:text-base">
                                                            {product.name}
                                                        </h3>
                                                        <p className="text-xs lg:text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-base lg:text-lg font-bold text-[#9d6a4e]">
                                                                ARS ${product.price?.toLocaleString()}
                                                            </span>
                                                            <span className="text-xs lg:text-sm text-gray-500">Stock: {product.stockCount || 1}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                onClick={() => handleToggleStock(product)}
                                                                size="sm"
                                                                variant="outline"
                                                                className={`flex-1 text-xs lg:text-sm ${product.inStock
                                                                    ? "border-red-200 text-red-600 hover:bg-red-50"
                                                                    : "border-green-200 text-green-600 hover:bg-green-50"
                                                                    }`}
                                                            >
                                                                {product.inStock ? (
                                                                    <EyeOff className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                                                ) : (
                                                                    <Eye className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                                                                )}
                                                                {product.inStock ? "Ocultar" : "Mostrar"}
                                                            </Button>
                                                            {/* New button to edit images */}
                                                            <Button
                                                                onClick={() => startEditingImages(product)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-[#ebcfc4] text-[#9d6a4e] hover:bg-[#f5f0ed] px-2 lg:px-3"
                                                            >
                                                                <ImageIcon className="w-3 h-3 lg:w-4 lg:h-4" />
                                                                <span className="ml-1 hidden sm:inline">Imágenes</span>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleDeleteProduct(product.id, product.name)}
                                                                size="sm"
                                                                variant="outline"
                                                                className="border-red-200 text-red-600 hover:bg-red-50 px-2 lg:px-3"
                                                            >
                                                                <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>

            {/* Category/Subcategory Creation Modal */}
            {isCategoryModalOpen && (
                <>
                    {/* Overlay */}
                    <div className="fixed inset-0 bg-black/50 z-50" onClick={closeCategoryModal} />
                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                            <div className="sticky top-0 bg-white border-b border-[#ebcfc4] p-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-[#9d6a4e] flex items-center">
                                    <FolderPlus className="w-5 h-5 mr-2" />
                                    Crear Categoría o Subcategoría
                                </h2>
                                <Button variant="ghost" size="sm" onClick={closeCategoryModal}>
                                    <X className="w-6 h-6" />
                                </Button>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Lista de Categorías Creadas */}
                                {firestoreCategories.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-[#9d6a4e] mb-4 flex items-center">
                                            <Package className="w-5 h-5 mr-2" />
                                            Categorías Creadas ({firestoreCategories.length})
                                        </h3>
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {firestoreCategories.map((category) => {
                                                const isEditing = editingCategoryId === category.id
                                                const subcategories = category.subcategories || []
                                                const canAddMore = subcategories.length < 10

                                                return (
                                                    <div
                                                        key={category.id}
                                                        className="p-3 bg-[#f5f0ed] rounded-lg border border-[#ebcfc4]"
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xl">{category.icon || "📦"}</span>
                                                                <div>
                                                                    <div className="font-medium text-[#9d6a4e]">{category.name}</div>
                                                                    {category.description && (
                                                                        <div className="text-xs text-gray-500">{category.description}</div>
                                                                    )}
                                                                    <div className="text-xs text-gray-400 mt-1">
                                                                        {subcategories.length}/10 subcategorías
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    onClick={() => {
                                                                        if (isEditing) {
                                                                            setEditingCategoryId(null)
                                                                            setNewSubcategoryNameToAdd("")
                                                                        } else {
                                                                            setEditingCategoryId(category.id)
                                                                        }
                                                                    }}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-[#9d6a4e] hover:text-[#b38872] hover:bg-[#ebcfc4]"
                                                                >
                                                                    <Pencil className="w-4 h-4 mr-1" />
                                                                    {isEditing ? "Cancelar" : "Editar"}
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        {/* Mostrar subcategorías existentes */}
                                                        {subcategories.length > 0 && (
                                                            <div className="mt-2 mb-3">
                                                                <div className="text-xs font-medium text-[#9d6a4e] mb-1">Subcategorías:</div>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {subcategories.map((sub: string, index: number) => (
                                                                        <Badge
                                                                            key={index}
                                                                            variant="secondary"
                                                                            className="text-xs bg-[#ebcfc4] text-[#9d6a4e] flex items-center gap-1"
                                                                        >
                                                                            {sub}
                                                                            {isEditing && (
                                                                                <button
                                                                                    onClick={() => handleRemoveSubcategory(category.id, sub)}
                                                                                    className="ml-1 hover:text-red-600"
                                                                                >
                                                                                    <X className="w-3 h-3" />
                                                                                </button>
                                                                            )}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Formulario para agregar subcategorías */}
                                                        {isEditing && (
                                                            <div className="mt-3 pt-3 border-t border-[#ebcfc4]">
                                                                {canAddMore ? (
                                                                    <div className="flex gap-2">
                                                                        <Input
                                                                            value={newSubcategoryNameToAdd}
                                                                            onChange={(e) => setNewSubcategoryNameToAdd(e.target.value)}
                                                                            placeholder="Nombre de la subcategoría"
                                                                            className="flex-1 text-sm"
                                                                            onKeyPress={(e) => {
                                                                                if (e.key === "Enter" && newSubcategoryNameToAdd.trim()) {
                                                                                    handleAddSubcategoryToCategory(category.id)
                                                                                }
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            onClick={() => handleAddSubcategoryToCategory(category.id)}
                                                                            disabled={!newSubcategoryNameToAdd.trim() || addingSubcategory}
                                                                            size="sm"
                                                                            className="bg-[#9d6a4e] hover:bg-[#b38872] text-white"
                                                                        >
                                                                            {addingSubcategory ? (
                                                                                <>
                                                                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                                                                    Agregando...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Plus className="w-3 h-3 mr-1" />
                                                                                    Agregar
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                                                        Máximo de 10 subcategorías alcanzado. Elimina una para agregar otra.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Crear Categoría */}
                                <div>
                                    <h3 className="text-lg font-semibold text-[#9d6a4e] mb-4 flex items-center">
                                        <Tag className="w-5 h-5 mr-2" />
                                        Nueva Categoría
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="categoryName" className="text-[#9d6a4e] font-medium">
                                                Nombre de la Categoría *
                                            </Label>
                                            <Input
                                                id="categoryName"
                                                value={newCategoryName}
                                                onChange={(e) => setNewCategoryName(e.target.value)}
                                                placeholder="Ej: Electrónica"
                                                className="mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="categoryIcon" className="text-[#9d6a4e] font-medium">
                                                Icono (Emoji)
                                            </Label>
                                            <Input
                                                id="categoryIcon"
                                                value={newCategoryIcon}
                                                onChange={(e) => setNewCategoryIcon(e.target.value)}
                                                placeholder="📦"
                                                className="mt-1"
                                                maxLength={2}
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Ingresa un emoji para representar la categoría
                                            </p>
                                        </div>
                                        <div>
                                            <Label htmlFor="categoryDescription" className="text-[#9d6a4e] font-medium">
                                                Descripción
                                            </Label>
                                            <Textarea
                                                id="categoryDescription"
                                                value={newCategoryDescription}
                                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                                placeholder="Descripción opcional de la categoría"
                                                className="mt-1"
                                                rows={3}
                                            />
                                        </div>

                                        {/* Opción para crear subcategoría al mismo tiempo */}
                                        <div className="flex items-center space-x-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="createSubcategoryWithCategory"
                                                checked={createSubcategoryWithCategory}
                                                onChange={(e) => setCreateSubcategoryWithCategory(e.target.checked)}
                                                className="rounded border-[#ebcfc4]"
                                            />
                                            <Label htmlFor="createSubcategoryWithCategory" className="text-[#9d6a4e] font-medium cursor-pointer">
                                                También crear una subcategoría
                                            </Label>
                                        </div>

                                        {createSubcategoryWithCategory && (
                                            <div>
                                                <Label htmlFor="initialSubcategoryName" className="text-[#9d6a4e] font-medium">
                                                    Nombre de la Subcategoría *
                                                </Label>
                                                <Input
                                                    id="initialSubcategoryName"
                                                    value={initialSubcategoryName}
                                                    onChange={(e) => setInitialSubcategoryName(e.target.value)}
                                                    placeholder="Ej: Auriculares"
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleCreateCategory}
                                            disabled={creatingCategory || !newCategoryName.trim() || (createSubcategoryWithCategory && !initialSubcategoryName.trim())}
                                            className="w-full bg-[#9d6a4e] hover:bg-[#b38872] text-white border-0"
                                        >
                                            {creatingCategory ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Creando...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    {createSubcategoryWithCategory ? "Crear Categoría y Subcategoría" : "Crear Categoría"}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
