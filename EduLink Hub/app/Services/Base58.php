<?php

namespace App\Services;

class Base58
{
    private const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

    /**
     * Decode a base58 string to binary data
     */
    public static function decode(string $base58): ?string
    {
        $alphabet = self::ALPHABET;
        $indexes = array_flip(str_split($alphabet));
        $len = strlen($base58);
        $bytes = [0];

        for ($i = 0; $i < $len; $i++) {
            $char = $base58[$i];
            if (!isset($indexes[$char])) {
                return null;
            }
            $carry = $indexes[$char];
            for ($j = 0; $j < count($bytes); $j++) {
                $carry += $bytes[$j] * 58;
                $bytes[$j] = $carry & 0xff;
                $carry >>= 8;
            }
            while ($carry > 0) {
                $bytes[] = $carry & 0xff;
                $carry >>= 8;
            }
        }

        $leadingZeros = 0;
        while ($leadingZeros < $len && $base58[$leadingZeros] === '1') {
            $leadingZeros++;
        }

        $result = '';
        for ($i = 0; $i < $leadingZeros; $i++) {
            $result .= "\x00";
        }

        for ($i = count($bytes) - 1; $i >= 0; $i--) {
            $result .= chr($bytes[$i]);
        }

        return $result;
    }

    /**
     * Encode binary data into base58 string
     */
    public static function encode(string $data): string
    {
        $alphabet = self::ALPHABET;
        $bytes = array_values(unpack('C*', $data));
        $length = count($bytes);

        $digits = [0];
        for ($i = 0; $i < $length; $i++) {
            $carry = $bytes[$i];
            for ($j = 0; $j < count($digits); $j++) {
                $carry += $digits[$j] << 8;
                $digits[$j] = $carry % 58;
                $carry = intdiv($carry, 58);
            }
            while ($carry > 0) {
                $digits[] = $carry % 58;
                $carry = intdiv($carry, 58);
            }
        }

        $leadingZeros = 0;
        while ($leadingZeros < $length && $bytes[$leadingZeros] === 0) {
            $leadingZeros++;
        }

        $result = str_repeat('1', $leadingZeros);
        for ($i = count($digits) - 1; $i >= 0; $i--) {
            $result .= $alphabet[$digits[$i]];
        }

        return $result;
    }
}
