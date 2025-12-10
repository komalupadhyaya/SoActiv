/**
 * Password Utility
 * Generates secure random passwords for staff accounts
 */

/**
 * Generates a secure random password
 * @param length - Length of password (default: 12, min: 10, max: 14)
 * @returns Secure random password string
 */
export function generateSecurePassword(length: number = 12): string {
    // Ensure length is within bounds
    const passwordLength = Math.max(10, Math.min(14, length));

    // Character sets
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    // Combine all character sets
    const allChars = uppercase + lowercase + numbers + special;

    // Ensure at least one character from each set
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < passwordLength; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password to avoid predictable patterns
    return password
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}
