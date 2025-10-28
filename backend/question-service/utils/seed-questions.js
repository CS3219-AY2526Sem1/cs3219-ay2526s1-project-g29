const mongoose = require('mongoose');
const Question = require('../models/question-model');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') });

const MONGO_URI = process.env.QUESTION_DB_CLOUD_URI || 'mongodb://127.0.0.1:27017/peerprepQuestionServiceDB';

const sampleQuestions = [
    {
        title: "Reverse a String",
        description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.

Example 1:
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]

Example 2:
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]

Constraints:
1 <= s.length <= 105 s[i] is a printable ascii character.`,
        difficulty: "easy",
        topics: ["strings", "algorithms"],
        constraints: `• 1 <= s.length <= 10^5
• s[i] is a printable ascii character.`
    },
    {
        title: "Linked List Cycle Detection",
        description: "Implement a function to detect if a linked list contains a cycle.",
        difficulty: "easy",
        topics: ["data-structures", "algorithms", "linked-lists"],
    },
    {
        title: "Add Binary",
        description: "Given two binary strings a and b, return their sum as a binary string.",
        difficulty: "easy",
        topics: ["bit-manipulation", "algorithms", "strings"],
    },
    {
        title: "Fibonacci Number",
        description: `The Fibonacci numbers, commonly denoted F(n) form a sequence, called the Fibonacci sequence, such that each number is the sum of the two preceding ones, starting from 0 and 1. That is,

F(0) = 0, F(1) = 1
F(n) = F(n - 1) + F(n - 2), for n > 1.

Given n, calculate F(n).`,
        difficulty: "easy",
        topics: ["recursion", "algorithms", "dynamic-programming"],
    },
    {
        title: "Repeated DNA Sequences",
        description: `The DNA sequence is composed of a series of nucleotides abbreviated as 'A', 'C', 'G', and 'T'.

For example, "ACGAATTCCG" is a DNA sequence.

When studying DNA, it is useful to identify repeated sequences within the DNA.

Given a string s that represents a DNA sequence, return all the 10-letter-long sequences (substrings) that occur more than once in a DNA molecule. You may return the answer in any order.`,
        difficulty: "medium",
        topics: ["algorithms", "bit-manipulation", "hash-tables", "strings"],
    },
    {
        title: "LRU Cache Design",
        description: "Design and implement an LRU (Least Recently Used) cache.",
        difficulty: "medium",
        topics: ["data-structures", "hash-tables"],
    },
    {
        title: "Longest Common Subsequence",
        description: `Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.

A subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.

For example, "ace" is a subsequence of "abcde".

A common subsequence of two strings is a subsequence that is common to both strings.`,
        difficulty: "medium",
        topics: ["strings", "algorithms", "dynamic-programming"],
    },
    {
        title: "Rotate Image",
        description: "You are given an n x n 2D matrix representing an image, rotate the image by 90 degrees (clockwise).",
        difficulty: "medium",
        topics: ["arrays", "algorithms", "matrix"],
    },
    {
        title: "Validate Binary Search Tree",
        description: "Given the root of a binary tree, determine if it is a valid binary search tree (BST).",
        difficulty: "medium",
        topics: ["data-structures", "algorithms", "trees"],
    },
    {
        title: "Sliding Window Maximum",
        description: `You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. You can only see the k numbers in the window. Each time the sliding window moves right by one position.

Return the max sliding window.`,
        difficulty: "hard",
        topics: ["arrays", "algorithms"],
    },
    {
        title: "Serialize and Deserialize a Binary Tree",
        description: `Serialization is the process of converting a data structure or object into a sequence of bits so that it can be stored in a file or memory buffer, or transmitted across a network connection link to be reconstructed later in the same or another computer environment.

Design an algorithm to serialize and deserialize a binary tree. There is no restriction on how your serialization/deserialization algorithm should work. You just need to ensure that a binary tree can be serialized to a string and this string can be deserialized to the original tree structure.`,
        difficulty: "hard",
        topics: ["data-structures", "algorithms", "trees"],
    },
    {
        title: "Wildcard Matching",
        description: `Given an input string (s) and a pattern (p), implement wildcard pattern matching with support for '?' and '*' where:

'?' Matches any single character.
'*' Matches any sequence of characters (including the empty sequence).

The matching should cover the entire input string (not partial).`,
        difficulty: "hard",
        topics: ["strings", "algorithms", "dynamic-programming"],
    },
    {
        title: "Chalkboard XOR Game",
        description: `You are given an array of integers nums represents the numbers written on a chalkboard.

Alice and Bob take turns erasing exactly one number from the chalkboard, with Alice starting first. If erasing a number causes the bitwise XOR of all the elements of the chalkboard to become 0, then that player loses. The bitwise XOR of one element is that element itself, and the bitwise XOR of no elements is 0.

Also, if any player starts their turn with the bitwise XOR of all the elements of the chalkboard equal to 0, then that player wins.

Return true if and only if Alice wins the game, assuming both players play optimally.`,
        difficulty: "hard",
        topics: ["bit-manipulation"],
    },
];

async function seedQuestions() {
    try {
        console.log(`Connecting to: ${MONGO_URI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB'}`);

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('Connected to MongoDB');
        console.log(`Database: ${mongoose.connection.name}`);

        const inserted = await Question.insertMany(sampleQuestions);

        console.log(`Successfully seeded ${inserted.length} questions!`);

        const summary = await Question.aggregate([
            {
                $group: {
                    _id: '$difficulty',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        console.log('\n📊 Question Summary:');
        summary.forEach(s => {
            console.log(`   ${s._id}: ${s.count} questions`);
        });

    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

seedQuestions();