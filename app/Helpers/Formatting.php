<?php

namespace App\Helpers;

class Formatting
{
    /**
     * Transform the body of the post.
     *
     * @param string $body
     *
     * @return string
     */
    public static function transformBody($text)
    {
        $text = self::makeLinks($text);
        $text = self::wpautop($text);

        return $text;
    }

    /**
     * Makes links clickable in the given text.
     *
     * @param string $text The text to process.
     * @return string The processed text with clickable links.
     */
    public static function makeLinks($text)
    {
        return preg_replace('/(http|https):\/\/[a-zA-Z0-9\.\-\/\?\&\=\_\%\#]+/', '<a href="$0" target="_blank">$0</a>', $text);
    }

    /**
     * Replaces double line breaks with paragraph elements.
     *
     * @param string $text The text to process.
     * @param bool $br Whether to add line breaks.
     * @return string The processed text with paragraph elements.
     */
    public static function wpautop($text, $br = true)
    {
        if (trim($text) === '') {
            return '';
        }

        // Just to make things a little easier, pad the end.
        $text = $text . "\n";

        // Change multiple <br>'s into two line breaks, which will turn into paragraphs.
        $text = preg_replace('|<br\s*/?>\s*<br\s*/?>|', "\n\n", $text);

        // Add a double line break after hr tags, which are self closing.
        $text = preg_replace('!(<hr\s*?/?>)!', "$1\n\n", $text);

        // Standardize newline characters to "\n".
        $text = str_replace(array( "\r\n", "\r" ), "\n", $text);

        // Remove more than two contiguous line breaks.
        $text = preg_replace("/\n\n+/", "\n\n", $text);

        // Split up the contents into an array of strings, separated by double line breaks.
        $paragraphs = preg_split('/\n\s*\n/', $text, -1, PREG_SPLIT_NO_EMPTY);

        // Reset $text prior to rebuilding.
        $text = '';

        // Rebuild the content as a string, wrapping every bit with a <p>.
        foreach ($paragraphs as $paragraph) {
            $text .= '<p class="mb-3">' . trim($paragraph, "\n") . "</p>\n";
        }

        // Under certain strange conditions it could create a P of entirely whitespace.
        $text = preg_replace('|<p>\s*</p>|', '', $text);

        return $text;
    }
}
