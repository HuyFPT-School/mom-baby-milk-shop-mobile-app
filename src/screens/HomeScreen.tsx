import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    FlatList,
    Image,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { toast } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Radius, Typography, Shadow } from '../constants/theme';
import { productApi, brandApi } from '../services/api';
import { getHierarchicalCategories } from '../services/categoryService';
import { getProductImage } from '../utils/formatters';
import ProductCard from '../components/ProductCard';
import BrandCard from '../components/BrandCard';
import CategoryList from '../components/CategoryList';
import PreOrderModal from '../components/PreOrderModal';
import { useCart } from '../context/CartContext';
import type { Product, Brand, HierarchicalCategory } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Feature items ───────────────────────────────────────────────────────────

const FEATURES = [
    {
        icon: 'happy-outline' as const,
        title: 'Sản phẩm chính hãng',
        desc: 'Cam kết 100% nhập khẩu chính hãng',
    },
    {
        icon: 'car-outline' as const,
        title: 'Giao hàng nhanh',
        desc: 'Miễn phí giao hàng đơn từ 500K',
    },
    {
        icon: 'heart-outline' as const,
        title: 'Tư vấn tận tâm',
        desc: 'Chuyên gia dinh dưỡng hỗ trợ 24/7',
    },
    {
        icon: 'shield-checkmark-outline' as const,
        title: 'Bảo hành đổi trả',
        desc: 'Đổi trả miễn phí trong 7 ngày',
    },
];

// ─── Banner data ─────────────────────────────────────────────────────────────

interface BannerItem {
    id: string;
    gradients: [string, string];
    icon: keyof typeof Ionicons.glyphMap;
    tag: string;
    title: string;
    subtitle: string;
}

const BANNERS: BannerItem[] = [
    {
        id: '1',
        gradients: [Colors.primary, '#9333EA'],
        icon: 'pricetag-outline',
        tag: 'KHUYẾN MÃI HOT',
        title: 'Ưu đãi\nlên đến 30%',
        subtitle: 'Cho tất cả sản phẩm sữa nhập khẩu',
    },
    {
        id: '2',
        gradients: ['#059669', '#0D9488'],
        icon: 'car-outline',
        tag: 'MIỄN PHÍ VẬN CHUYỂN',
        title: 'Free ship\nđơn từ 500K',
        subtitle: 'Giao hàng nhanh toàn quốc trong 24h',
    },
    {
        id: '3',
        gradients: ['#2563EB', '#7C3AED'],
        icon: 'star-outline',
        tag: 'TÍCH ĐIỂM',
        title: 'Đổi điểm\nlấy quà tặng',
        subtitle: 'Tích điểm mỗi đơn hàng, đổi quà hấp dẫn',
    },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const { addToCart } = useCart();

    // Data
    const [brands, setBrands] = useState<Brand[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<HierarchicalCategory[]>([]);

    // Loading
    const [productsLoading, setProductsLoading] = useState(true);
    const [brandsLoading, setBrandsLoading] = useState(true);
    const [categoriesLoading, setCategoriesLoading] = useState(true);

    // Pre-order modal
    const [preOrderProduct, setPreOrderProduct] = useState<Product | null>(null);

    // Banner
    const [activeBanner, setActiveBanner] = useState(0);
    const bannerRef = useRef<FlatList>(null);
    const bannerIndex = useRef(0);

    // ── Fetch data ──

    useEffect(() => {
        (async () => {
            try {
                setBrandsLoading(true);
                const res = await brandApi.getAll();
                const data = res.data.data ?? (res.data as unknown as Brand[]);
                setBrands(Array.isArray(data) ? data : []);
            } catch (e) {
                console.warn('Brands fetch failed:', e);
            } finally {
                setBrandsLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setProductsLoading(true);
                const res = await productApi.getAll();
                const data = res.data.data ?? (res.data as unknown as Product[]);
                const arr = Array.isArray(data) ? data : [];
                setProducts(
                    arr.slice(0, 8).map((p) => ({
                        ...p,
                        image_url: getProductImage(p),
                    })),
                );
            } catch (e) {
                console.warn('Products fetch failed:', e);
            } finally {
                setProductsLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            try {
                setCategoriesLoading(true);
                const data = await getHierarchicalCategories();
                setCategories(data);
            } catch (e) {
                console.warn('Categories fetch failed:', e);
            } finally {
                setCategoriesLoading(false);
            }
        })();
    }, []);

    // Banner auto-scroll
    useEffect(() => {
        const timer = setInterval(() => {
            bannerIndex.current = (bannerIndex.current + 1) % BANNERS.length;
            setActiveBanner(bannerIndex.current);
            bannerRef.current?.scrollToIndex({
                index: bannerIndex.current,
                animated: true,
            });
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    // ── Handlers ──

    const handleProductPress = useCallback((_product: Product) => {
        // TODO: navigate to product detail
    }, []);

    const handleAddToCart = useCallback(
        (product: Product) => {
            const isPreOrder =
                product.quantity === 0 ||
                (!!product.expectedRestockDate &&
                    new Date(product.expectedRestockDate) > new Date());

            if (isPreOrder && product.allowPreOrder !== false) {
                setPreOrderProduct(product);
            } else {
                addToCart({
                    ...product,
                    id: product._id,
                    image_url: getProductImage(product),
                });
                toast.success('Đã thêm vào giỏ hàng', product.name);
            }
        },
        [addToCart],
    );

    const handlePreOrderConfirm = useCallback(
        (data: {
            product: Product;
            quantity: number;
            preOrderType: 'OUT_OF_STOCK' | 'COMING_SOON';
            paymentOption: 'PAY_NOW';
        }) => {
            addToCart(
                { ...data.product, id: data.product._id, image_url: getProductImage(data.product) },
                {
                    quantity: data.quantity,
                    preOrderType: data.preOrderType,
                    paymentOption: data.paymentOption,
                    releaseDate: data.product.expectedRestockDate,
                },
            );
            setPreOrderProduct(null);
            if (data.preOrderType === 'OUT_OF_STOCK') {
                toast.success('Đặt trước thành công', data.product.name);
            } else {
                toast.info('Đăng ký đặt trước thành công', data.product.name);
            }
        },
        [addToCart],
    );

    // ── Render helpers ──

    const renderBanner = useCallback(
        ({ item }: { item: BannerItem }) => (
            <LinearGradient
                colors={item.gradients}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bannerSlide}
            >
                <View style={styles.bannerContent}>
                    <View style={styles.bannerLeft}>
                        <View style={styles.bannerTag}>
                            <Text style={styles.bannerTagText}>{item.tag}</Text>
                        </View>
                        <Text style={styles.bannerTitle}>{item.title}</Text>
                        <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.bannerIconCircle}>
                        <Ionicons name={item.icon} size={42} color={Colors.white} />
                    </View>
                </View>
            </LinearGradient>
        ),
        [],
    );

    const renderProduct = useCallback(
        ({ item }: { item: Product }) => (
            <ProductCard
                item={item}
                onPress={handleProductPress}
                onAddToCart={handleAddToCart}
            />
        ),
        [handleProductPress, handleAddToCart],
    );

    // ─── JSX ───────────────────────────────────────────────────────────────────

    return (
        <View style={styles.screen}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* ── Banner Carousel ── */}
                <View>
                    <FlatList
                        ref={bannerRef}
                        horizontal
                        pagingEnabled
                        data={BANNERS}
                        keyExtractor={(b) => b.id}
                        renderItem={renderBanner}
                        showsHorizontalScrollIndicator={false}
                        style={styles.bannerWrapper}
                        getItemLayout={(_, index) => ({
                            length: SCREEN_WIDTH,
                            offset: SCREEN_WIDTH * index,
                            index,
                        })}
                        onMomentumScrollEnd={(e) => {
                            const idx = Math.round(
                                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
                            );
                            bannerIndex.current = idx;
                            setActiveBanner(idx);
                        }}
                    />
                    {/* Dot indicators */}
                    <View style={styles.bannerDots}>
                        {BANNERS.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    activeBanner === i && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* ── Category Chips ── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Danh mục</Text>
                    <CategoryList
                        categories={categories}
                        loading={categoriesLoading}
                    />
                </View>

                {/* ── Features ── */}
                <View style={styles.featuresSection}>
                    <View style={styles.featuresGrid}>
                        {FEATURES.map((f) => (
                            <View key={f.title} style={styles.featureItem}>
                                <View style={styles.featureIcon}>
                                    <Ionicons
                                        name={f.icon}
                                        size={24}
                                        color={Colors.primary}
                                    />
                                </View>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Brands ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Thương hiệu uy tín</Text>
                    </View>
                    {brandsLoading ? (
                        <ActivityIndicator
                            size="small"
                            color={Colors.primary}
                            style={{ paddingVertical: Spacing.xl }}
                        />
                    ) : (
                        <FlatList
                            horizontal
                            data={brands}
                            keyExtractor={(b) => b._id}
                            renderItem={({ item }) => <BrandCard brand={item} />}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={{ paddingHorizontal: Spacing.base }}
                        />
                    )}
                </View>

                {/* ── Featured Products ── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
                    </View>
                    {productsLoading ? (
                        <ActivityIndicator
                            size="large"
                            color={Colors.primary}
                            style={{ paddingVertical: Spacing.xxxl }}
                        />
                    ) : (
                        <View style={styles.productGrid}>
                            {products.map((p) => (
                                <ProductCard
                                    key={p._id}
                                    item={p}
                                    onPress={handleProductPress}
                                    onAddToCart={handleAddToCart}
                                />
                            ))}
                        </View>
                    )}
                </View>

                {/* ── CTA Banner ── */}
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaBanner}
                >
                    <Text style={styles.ctaTitle}>
                        Đăng ký thành viên ngay hôm nay!
                    </Text>
                    <Text style={styles.ctaDesc}>
                        Nhận voucher giảm 10% cho đơn hàng đầu tiên. Tích điểm đổi quà hấp
                        dẫn và nhiều ưu đãi độc quyền.
                    </Text>
                    <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85}>
                        <Text style={styles.ctaBtnText}>Đăng ký ngay</Text>
                        <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                    </TouchableOpacity>
                </LinearGradient>

                <View style={{ height: 24 }} />
            </ScrollView>

            {/* ── PreOrder Modal ── */}
            <PreOrderModal
                visible={!!preOrderProduct}
                product={preOrderProduct}
                onClose={() => setPreOrderProduct(null)}
                onConfirm={handlePreOrderConfirm}
            />
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Banner
    bannerWrapper: {
        height: 200,
    },
    bannerSlide: {
        width: SCREEN_WIDTH,
        height: 200,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    bannerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    bannerLeft: {
        flex: 1,
        paddingRight: Spacing.lg,
    },
    bannerTag: {
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: Radius.full,
        marginBottom: Spacing.sm,
    },
    bannerTagText: {
        fontSize: Typography.size.xs,
        fontWeight: Typography.weight.bold,
        color: Colors.white,
        letterSpacing: 0.8,
    },
    bannerTitle: {
        fontSize: Typography.size.xl,
        fontWeight: Typography.weight.extraBold,
        color: Colors.white,
        lineHeight: 30,
        marginBottom: Spacing.xs,
    },
    bannerSubtitle: {
        fontSize: Typography.size.sm,
        color: 'rgba(255,255,255,0.85)',
        lineHeight: 18,
    },
    bannerIconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    bannerDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        gap: 6,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.border,
    },
    dotActive: {
        width: 18,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.primary,
    },

    // Sections
    section: {
        marginTop: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.size.md,
        fontWeight: Typography.weight.bold,
        color: Colors.text,
        paddingHorizontal: Spacing.base,
        marginBottom: Spacing.sm,
    },

    // Features
    featuresSection: {
        marginTop: Spacing.lg,
        backgroundColor: Colors.surface,
        paddingVertical: Spacing.lg,
    },
    featuresGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.sm,
    },
    featureItem: {
        width: '50%',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
    },
    featureIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.surfaceVariant,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.sm,
    },
    featureTitle: {
        fontSize: Typography.size.sm,
        fontWeight: Typography.weight.semiBold,
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    featureDesc: {
        fontSize: Typography.size.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 16,
    },

    // Product grid
    productGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.base,
    },

    // CTA
    ctaBanner: {
        marginHorizontal: Spacing.base,
        marginTop: Spacing.xl,
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    ctaTitle: {
        fontSize: Typography.size.lg,
        fontWeight: Typography.weight.bold,
        color: Colors.white,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    ctaDesc: {
        fontSize: Typography.size.sm,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: Spacing.lg,
    },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.white,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: Radius.full,
    },
    ctaBtnText: {
        fontSize: Typography.size.base,
        fontWeight: Typography.weight.semiBold,
        color: Colors.primary,
    },
});
