/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package workingwithmenu;

import java.awt.BorderLayout;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.swing.ButtonGroup;
import javax.swing.JButton;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JMenu;
import javax.swing.JMenuBar;
import javax.swing.JMenuItem;
import javax.swing.JPanel;
import javax.swing.JRadioButton;
import javax.swing.JSlider;
import javax.swing.JTextArea;
import javax.swing.JTextField;

/**
 *
 * @author Kgosi
 */
public class TsApp extends JFrame{
    private JPanel mainPanel;
    private JPanel leftPanel;
    private JPanel rightPanel;
    private JPanel namePanel;
    private JPanel surnamePanel;
    private JPanel agePanel;
    private JPanel favNumPanel;
    private JPanel genderPanel;
    private JPanel displayResultsPanel;
    private JPanel buttonsPanel;
    private JPanel panel;
    
    
    private JLabel nameLabel;
    private JLabel surnameLabel;
    private JLabel ageLabel;
    private JLabel favNumLabel;
    private JLabel genderLabel;
    
    private JTextField nameField;
    private JTextField surnameField;
    private JTextField ageField;
    
    private JSlider slider;
    
    private JRadioButton maleButton;
    private JRadioButton femaleButton;
    
    private JTextArea displayResults;
    
    private JButton showButton;
    private JButton clearButton;
    private JButton exitButton;
    
    //working with menu
    private JMenuBar menuBar;
    
    private JMenu fileMenu;
    private JMenu editMenu;
    private JMenu viewMenu;
    
    private JMenuItem openFileItem;
    private JMenuItem saveFileItem;
    
    public TsApp() {
        setTitle("Thabiso's App");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
//        setSize(400,500);
        
        menuBar = new JMenuBar();
        
        fileMenu = new JMenu("File");
        editMenu = new JMenu("Edit");
        viewMenu = new JMenu("View");
        
        menuBar.add(fileMenu);
        menuBar.add(editMenu);
        menuBar.add(viewMenu);
        
        openFileItem = new JMenuItem("Open File...");
        saveFileItem = new JMenuItem("Save File...");
        
        openFileItem.addActionListener(new OpenFile());
        saveFileItem.addActionListener(new SaveFile());
        fileMenu.add(openFileItem);
        fileMenu.addSeparator();
        fileMenu.add(saveFileItem);
        
        panel = new JPanel(new BorderLayout());
        
        mainPanel = new JPanel();
        leftPanel = new JPanel(new GridLayout(5, 1));
        namePanel = new JPanel();
        surnamePanel = new JPanel();
        agePanel = new JPanel();
        favNumPanel = new JPanel();
        genderPanel = new JPanel();
        
        rightPanel = new JPanel(new BorderLayout());
        displayResultsPanel = new JPanel();
        buttonsPanel = new JPanel();
        
        nameLabel = new JLabel("Name:      ");
        surnameLabel = new JLabel("Surname:    ");
        ageLabel = new JLabel("Age:        ");
        favNumLabel = new JLabel("Favourite number:   ");
        genderLabel = new JLabel("Select gender:");
        
        nameField = new JTextField(15);
        surnameField = new JTextField(15);
        ageField = new JTextField(15);
        
        slider = new JSlider(1,100);
        
        maleButton = new JRadioButton("Male");
        femaleButton = new JRadioButton("Female");
        
        ButtonGroup btns = new ButtonGroup();
        
        btns.add(maleButton);
        btns.add(femaleButton);
        
        displayResults = new JTextArea(20,30);
        displayResults.setEditable(false);
        
        showButton = new JButton("Show");
        clearButton = new JButton("Clear");
        exitButton = new JButton("Exit");
        
        //Make buttons responsive
        showButton.addActionListener(new ShowButton());
        clearButton.addActionListener(new ClearButton());
        exitButton.addActionListener(new ExitButton());
        
        
        
        namePanel.add(nameLabel);
        namePanel.add(nameField);
        
        surnamePanel.add(surnameLabel);
        surnamePanel.add(surnameField);
        
        agePanel.add(ageLabel);
        agePanel.add(ageField);
        
        favNumPanel.add(favNumLabel);
        favNumPanel.add(slider);
        
        genderPanel.add(genderLabel);
        genderPanel.add(maleButton);
        genderPanel.add(femaleButton);
        
        leftPanel.add(namePanel);
        leftPanel.add(surnamePanel);
        leftPanel.add(agePanel);
        leftPanel.add(favNumPanel);
        leftPanel.add(genderPanel);
        
        displayResultsPanel.add(displayResults);
        
        buttonsPanel.add(showButton);
        buttonsPanel.add(clearButton);
        buttonsPanel.add(exitButton);
        
        rightPanel.add(displayResultsPanel, BorderLayout.CENTER);
        rightPanel.add(buttonsPanel, BorderLayout.SOUTH);
        
        mainPanel.add(leftPanel);
        mainPanel.add(rightPanel);
        
        panel.add(menuBar, BorderLayout.NORTH);
        panel.add(mainPanel, BorderLayout.CENTER);
        
        add(panel);
        pack();
        setVisible(true);
    }

    private  class SaveFile implements ActionListener {

        @Override
        public void actionPerformed(ActionEvent e) {
            System.out.println("Save file....");
            
            JFileChooser chooser = new JFileChooser();
            
            int rs = chooser.showSaveDialog(saveFileItem);
            
            if(rs == JFileChooser.APPROVE_OPTION){
                File file = chooser.getSelectedFile();
                File newFile = new File("UserDetailsFile.txt");
                
                    try{
                        FileWriter fr = new FileWriter(file, true);
                        try(BufferedWriter write = new BufferedWriter(fr)){
                            String text = nameField.getText() + "\n" + surnameField.getText() + "\n" +
                            ageField.getText() +"\n"+ slider.getValue() + "\n"+ maleButton.getActionCommand() + femaleButton.getActionCommand()
                                    + "\n----------------------------";
                            write.write(text);
                            write.newLine();
                            
                        }
                    }catch (IOException ex) {
                        Logger.getLogger(TsApp.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }
    }
    private class OpenFile implements ActionListener {


        @Override
        public void actionPerformed(ActionEvent e) {
            System.out.println("Open file....");
            
            JFileChooser chooser = new JFileChooser();
            
            int rs = chooser.showOpenDialog(openFileItem);
            
            if(rs == JFileChooser.APPROVE_OPTION){
                
            }
        }
    }
    //Response to the buttons
    public class ShowButton implements ActionListener{

        @Override
        public void actionPerformed(ActionEvent e) {
            String details = nameField.getText() + "\n" + surnameField.getText() + "\n" +
                    ageField.getText() +"\n"+ slider.getValue() + "\n"+ maleButton.getActionCommand() + femaleButton.getActionCommand();
            displayResults.setText(details);
        } 
    }
    
    public class ClearButton implements ActionListener{

        @Override
        public void actionPerformed(ActionEvent e) {
            displayResults.setText(" ");
        }
    }
    
    public class ExitButton implements ActionListener{

        @Override
        public void actionPerformed(ActionEvent e) {
            System.exit(0);
        }
        
    }
    
}

