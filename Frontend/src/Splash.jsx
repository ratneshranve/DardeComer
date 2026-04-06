import { motion } from "framer-motion";

export default function Splash() {
    return (
        <div style={styles.container}>

            {/* LOGO */}
            <motion.img
                src="/foodelo.png"
                initial={{ y: 120, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{
                    duration: 1,
                    type: "spring",
                    stiffness: 120,
                    damping: 10
                }}
                style={styles.logo}
            />

            {/* TEXT */}
            <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                style={styles.text}
            >
                DardeComer
            </motion.h1>

        </div>
    );
}

const styles = {
    container: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",

        // 🔥 MATCHING LOGO COLORS
        background: "linear-gradient(135deg, #ff4da6, #7b2cff)",
    },

    logo: {
        width: "220px",
        marginBottom: "10px",

        // ✨ GLOW EFFECT
        filter: "drop-shadow(0px 10px 25px rgba(0,0,0,0.3))",
    },

    text: {
        color: "white",
        fontSize: "28px",
        fontWeight: "bold",
        letterSpacing: "1px",
    }
};